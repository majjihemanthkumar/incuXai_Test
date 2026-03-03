import { toast } from 'react-toastify';

export class SocketClient {
    ws: WebSocket | null = null;
    heartbeatInterval: any = null;
    onMessageHandlers: Record<string, (data: any) => void> = {};

    connect(examId: string, role: string, participantId: string) {
        // Determine WS URL based on current host - in dev fallback to local worker
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.port === '3000' ? '127.0.0.1:8787' : window.location.host;
        const url = `${protocol}//${host}/api/exams/${examId}/ws?role=${role}&participantId=${participantId}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('Connected to Server-Authoritative Exam Room');
            this.send({ type: 'JOIN' });

            // Heartbeat every 2 seconds for anti-cheat
            if (role === 'student') {
                this.heartbeatInterval = setInterval(() => {
                    this.send({ type: 'HEARTBEAT' });
                }, 2000);
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type && this.onMessageHandlers[data.type]) {
                    this.onMessageHandlers[data.type](data);
                }
            } catch (e) {
                console.error('WS parse error', e);
            }
        };

        this.ws.onclose = () => {
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
            toast.error('Connection to server lost.');
        };
    }

    disconnect() {
        if (this.ws) this.ws.close();
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    on(type: string, handler: (data: any) => void) {
        this.onMessageHandlers[type] = handler;
    }
}
