import React from 'react';

const loadingMessages = [
  "Constructing your palace...",
  "Mapping the loci...",
  "Crafting vivid scenes...",
  "Polishing the mnemonics...",
  "Consulting the memory architects...",
  "Almost there, sharpening the details..."
];

const Loader: React.FC = () => {
    const [message, setMessage] = React.useState(loadingMessages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-semibold text-gray-800 transition-opacity duration-500">{message}</p>
        </div>
    );
};

export default Loader;