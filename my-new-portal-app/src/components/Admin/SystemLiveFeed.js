import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { FaBolt, FaExclamationTriangle, FaUserPlus, FaDatabase, FaMoneyBillWave } from 'react-icons/fa';

const getIcon = (type) => {
    switch (type) {
        case 'REVENUE': return <FaMoneyBillWave className="text-green-400" />;
        case 'SYSTEM': return <FaBolt className="text-yellow-400" />;
        case 'ERROR': return <FaExclamationTriangle className="text-red-500" />;
        case 'USER_SIGNUP': return <FaUserPlus className="text-blue-400" />;
        case 'VERTEX_FAILOVER': return <FaDatabase className="text-orange-500" />;
        default: return <FaBolt className="text-gray-400" />;
    }
};

const SystemLiveFeed = () => {
    const [events, setEvents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('lexai_token');
        if (!token) return;

        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
            transports: ['websocket'],
            autoConnect: true,
            auth: { token } // Ideally verify on backend
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join_admin_feed', 'admin'); // Hardcoded role for now or derived from token logic
        });

        newSocket.on('admin_pulse', (data) => {
            setEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50
        });

        newSocket.on('disconnect', () => setIsConnected(false));

        return () => newSocket.disconnect();
    }, []);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    System Live Feed
                </h3>
                <span className="text-xs text-gray-500 font-mono">CHANNEL: ADMIN_PULSE</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2" ref={scrollRef}>
                {events.length === 0 ? (
                    <div className="text-center text-gray-600 mt-10 text-sm">
                        Waiting for system events...
                    </div>
                ) : (
                    events.map((evt, idx) => (
                        <div key={idx} className="bg-gray-900/50 p-3 rounded border border-gray-800 flex gap-3 items-start animate-in slide-in-from-right duration-300">
                            <div className="mt-1">{getIcon(evt.type)}</div>
                            <div>
                                <div className="text-sm font-semibold text-gray-200">{evt.title}</div>
                                <div className="text-xs text-gray-400">{evt.message}</div>
                                <div className="text-[10px] text-gray-600 mt-1 font-mono">
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SystemLiveFeed;
