import React from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaLock, FaDatabase, FaServer, FaHandshake } from 'react-icons/fa';


const PrivacyPage = () => {
    return (
        <>
            {/* <Navbar /> */}
            <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
                <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border-t-8 border-emerald-700"
                    >
                        <div className="text-center mb-8 md:mb-12">
                            <FaUserShield className="mx-auto text-4xl md:text-5xl text-emerald-700 mb-4" />
                            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
                            <p className="text-gray-500 mt-2 text-sm md:text-base">Compliance: DPDP Act 2023 & IT Act 2000</p>
                        </div>

                        <div className="prose prose-base md:prose-lg text-gray-700 max-w-none">

                            <p className="lead text-base md:text-xl text-gray-600 mb-6 md:mb-8">
                                At <strong>LexAI Portal</strong>, we treat your privacy with the same sanctity as Attorney-Client Privilege.
                                This Privacy Policy outlines how we act as a <strong>Data Fiduciary</strong> in collecting, processing, and protecting your data
                                in accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
                            </p>

                            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">
                                <FaDatabase className="text-emerald-600 flex-shrink-0" /> 1. Information We Collect
                            </h2>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                                <li><strong>Personal Identity Data:</strong> Username, Email ID, Mobile Number (verified via OTP), and Bar Council Enrollment ID (for Advocates).</li>
                                <li><strong>Professional Data:</strong> Profession type (Lawyer, Lekhpal, CSC), and Subscription tier.</li>
                                <li><strong>Usage Data:</strong> AI Prompt history, generated legal drafts, and Session logs (collected as per standard SaaS logs).</li>
                                <li><strong>uploaded Artifacts:</strong> PDF/DOCX files you upload for analysis (temporarily processed in RAM/Cache).</li>
                            </ul>

                            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">
                                <FaServer className="text-blue-600 flex-shrink-0" /> 2. How We Use Your Data
                            </h2>
                            <p className="text-sm md:text-base">We process your data strictly for "Lawful Purposes" as defined under Section 4 of the DPDP Act:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                                <li>To provide Legal AI services (answering queries, drafting).</li>
                                <li>To authenticate your identity and prevent authorized access.</li>
                                <li>To process subscription payments via secure gateways.</li>
                                <li>To improve the accuracy of our Indian Legal Models (only on anonymized, aggregated datasets).</li>
                            </ul>

                            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">
                                <FaLock className="text-indigo-600 flex-shrink-0" /> 3. Data Storage & Security
                            </h2>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                                <li><strong>Localization:</strong> All sensitive user data is stored on secure servers located within <strong>India</strong>, complying with data sovereignty norms.</li>
                                <li><strong>Encryption:</strong> Data at rest is encrypted using AES-256 standards. Data in transit is protected via TLS 1.3 protocols.</li>
                                <li><strong>AI Processing:</strong> Your prompts are processed via secure APIs (e.g., Google Gemini Enterprise). We have Data Processing Agreements (DPAs) ensuring they do not use your confidential client data to train their public models.</li>
                            </ul>

                            <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">
                                <FaHandshake className="text-orange-600 flex-shrink-0" /> 4. Third-Party Sharing
                            </h2>
                            <p className="text-sm md:text-base">
                                We do NOT sell your data. We share data only with:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                                <li><strong>Payment Processors:</strong> (e.g., Razorpay/Stripe) solely for billing.</li>
                                <li><strong>Legal Authorities:</strong> Only if served with a valid court order or warrant under Section 91 CrPC/Section 94 BNSS.</li>
                            </ul>

                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-6">5. Your Rights (Data Principal)</h2>
                            <p className="text-sm md:text-base">Under the DPDP Act, you have the right to:</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
                                <li><strong>Access:</strong> Request a summary of your personal data processed by us.</li>
                                <li><strong>Correction:</strong> Update inaccurate or incomplete records.</li>
                                <li><strong>Erasure (Right to be Forgotten):</strong> Request deletion of your account and history, unless retention is required by law (e.g., for tax audits).</li>
                                <li><strong>Grievance Redressal:</strong> Contact our Grievance Officer.</li>
                            </ul>

                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-6">6. Grievance Officer</h2>
                            <p className="bg-gray-100 p-4 rounded border border-gray-300 text-sm md:text-base">
                                <strong>Name:</strong> [Legal Compliance Head]<br />
                                <strong>Email:</strong> compliance@lexai.in<br />
                                <strong>Address:</strong> LexAI Legal Tech Pvt Ltd, Cyber City, Gurugram, India.<br />
                                We shall respond to grievances within 72 hours as mandated by IT Rules.
                            </p>

                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-6">7. Updates to Policy</h2>
                            <p className="text-sm md:text-base">
                                We may update this policy to reflect changes in Indian Law (e.g., Digital India Act rules). Continued use implies consent to the updated policy.
                            </p>

                        </div>

                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 text-center">
                            <button
                                onClick={() => window.close()}
                                className="mt-6 w-full md:w-auto px-8 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition shadow-lg font-semibold text-sm md:text-base"
                            >
                                Close Window
                            </button>
                        </div>

                    </motion.div>
                </div>
            </div>
            {/* <Footer /> */}
        </>
    );
};

export default PrivacyPage;
