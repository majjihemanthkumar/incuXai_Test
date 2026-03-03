import React from 'react';

const sponsors = [
    'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg'
];

export const SponsorScroll: React.FC = () => {
    return (
        <div className="absolute bottom-0 w-full py-6 scroll-container bg-black/50 border-t border-gray-800">
            <div className="scroll-content flex items-center">
                {/* Double array for seamless loop */}
                {[...sponsors, ...sponsors, ...sponsors, ...sponsors].map((src, idx) => (
                    <img key={idx} src={src} className="sponsor-logo invert opacity-70" alt="sponsor" loading="eager" />
                ))}
            </div>
        </div>
    );
};
