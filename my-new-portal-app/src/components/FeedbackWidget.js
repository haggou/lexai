import React, { useState } from 'react';
import { FaCommentDots, FaTimes, FaStar, FaPaperPlane } from 'react-icons/fa';

const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('other');
    const [rating, setRating] = useState(0);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            const token = localStorage.getItem('lexai_token');
            if (!token) {
                alert("Please login to submit feedback.");
                setSending(false);
                return;
            }

            const envUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
            // Ensure we don't double up on /api
            const apiUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

            const res = await fetch(`${apiUrl}/users/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message, type, rating })
            });

            console.log("[WIDGET] Response Status:", res.status);
            if (res.ok) {
                console.log("[WIDGET] Feedback Submitted Successfully");
                setSuccess(true);
                setMessage('');
                setRating(0);
                setTimeout(() => {
                    setSuccess(false);
                    setIsOpen(false);
                }, 2000);
            } else {
                const errData = await res.json();
                console.error("[WIDGET] Submission Failed:", errData);
                alert(`Failed: ${errData.error || res.statusText}`);
            }
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Bubble Form */}
            {isOpen && (
                <div className="mb-4 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                        <h3 className="text-white font-bold text-sm">Send Feedback</h3>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>

                    {success ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaPaperPlane className="text-white" />
                            </div>
                            <p className="text-white font-bold">Thank You!</p>
                            <p className="text-gray-400 text-xs mt-1">Your feedback helps us improve.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Feedback Type</label>
                                <select
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none focus:border-blue-500"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="other">General Feedback</option>
                                    <option value="bug">Report a Bug</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="ui_ux">UI/UX Issue</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Your Message</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none focus:border-blue-500 min-h-[80px] resize-none"
                                    placeholder="Tell us what you think..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Rating (Optional)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`text-lg transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500'}`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-white text-black font-bold py-2 rounded-lg text-xs mt-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {sending ? 'Sending...' : 'Submit Feedback'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center text-white text-xl hover:scale-110 transition-transform active:scale-95"
            >
                {isOpen ? <FaTimes /> : <FaCommentDots />}
            </button>
        </div>
    );
};

export default FeedbackWidget;
