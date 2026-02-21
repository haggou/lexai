import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalCard from '../PortalCard/PortalCard';
import styles from './PortalGrid.module.css';

import {
    FaMap, FaLandmark, FaGavel, FaClipboardCheck, FaFileContract,
    FaIdCard, FaLaptopCode, FaBalanceScale, FaFingerprint, FaChartLine,
    FaSearch, FaCamera, FaMoneyBill, FaTimes, FaPlus, FaTrash, FaLanguage, FaFileAlt
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Translations for static text
const translations = {
    en: {
        title: "Digital Seva Portal",
        subtitle: "Unified access to all government and legal digital services.",
        searchPlaceholder: "Search services...",
        addNew: "Add New",
        addCustom: "Add Custom Portal",
        portalTitle: "Portal Title",
        websiteUrl: "Website URL (https://...)",
        description: "Description (Optional)",
        save: "Save Portal",
        cancel: "Cancel",
        deleteConfirm: "Delete this portal?",
        loginAlert: "Please login to add portals.",
        authError: "Authentication error. Please login again.",
        addError: "Failed to add portal",
        noServices: "No services found",
        tryAdjusting: "Try adjusting your search or filters.",
        openPortal: "Open Portal",
        viewService: "View Service",
        categories: {
            all: 'All',
            land: 'Land',
            legal: 'Legal',
            document: 'Documents',
            service: 'Service',
            tool: 'Tool',
            utility: 'Utility',
            agriculture: 'Agriculture',
            personal: 'My Portals'
        }
    },
    hi: {
        title: "डिजिटल सेवा पोर्टल",
        subtitle: "सभी सरकारी और कानूनी डिजिटल सेवाओं तक एकीकृत पहुंच।",
        searchPlaceholder: "सेवाएं खोजें...",
        addNew: "नया जोड़ें",
        addCustom: "कस्टम पोर्टल जोड़ें",
        portalTitle: "पोर्टल शीर्षक",
        websiteUrl: "वेबसाइट लिंक (https://...)",
        description: "विवरण (वैकल्पिक)",
        save: "पोर्टल सहेजें",
        cancel: "रद्द करें",
        deleteConfirm: "क्या आप इस पोर्टल को हटाना चाहते हैं?",
        loginAlert: "पोर्टल जोड़ने के लिए कृपया लॉग इन करें।",
        authError: "प्रमाणीकरण त्रुटि। कृपया पुनः लॉगिन करें।",
        addError: "पोर्टल जोड़ने में विफल",
        noServices: "कोई सेवा नहीं मिली",
        tryAdjusting: "अपनी खोज या फ़िल्टर समायोजित करने का प्रयास करें।",
        openPortal: "पोर्टल खोलें",
        viewService: "सेवा देखें",
        categories: {
            all: 'सभी',
            land: 'जमीन',
            legal: 'कानूनी',
            document: 'दस्तावेज़',
            service: 'सेवा',
            tool: 'टूल',
            utility: 'उपयोगिता',
            agriculture: 'कृषि',
            personal: 'मेरे पोर्टल'
        }
    }
};

// Enhanced portal data with categories and popularity
const defaultPortalData = [
    {
        id: '1',
        title: 'UP Bhunaksha (भू-नक्शा)',
        descriptionHi: 'अपने खेत, प्लॉट या घर का आधिकारिक नक्शा देखें और डिजिटल कॉपी डाउनलोड करें।',
        descriptionEn: 'View the official map of your farm, plot or house and download a digital copy.',
        icon: FaMap,
        iconColor: '#28a745',
        category: 'land',
        popularity: 5,
        path: 'https://upbhunaksha.gov.in/',
        isExternal: true
    },
    {
        id: '1-dup',
        title: 'UP E-Khasra (ई-खसरा)',
        descriptionHi: 'अपनी कृषि भूमि का वार्षिक फसली विवरण और खसरा रिपोर्ट ऑनलाइन प्राप्त करें।',
        descriptionEn: 'Get annual crop details and Khasra report of your agricultural land online.',
        icon: FaMap,
        iconColor: '#28a745',
        category: 'land',
        popularity: 5,
        path: 'https://ekhasra.up.gov.in/#/khasrareport',
        isExternal: true
    },
    {
        id: '2',
        title: 'UP Bhulekh (खतौनी)',
        descriptionHi: 'जमीन का इन्तखाब, रियल-टाइम खतौनी और स्वामित्व विवरण की जांच के लिए आधिकारिक पोर्टल।',
        descriptionEn: 'Official portal to check land records, real-time Khatauni and ownership details.',
        icon: FaLandmark,
        iconColor: '#e74c3c',
        category: 'land',
        popularity: 5,
        path: 'https://upbhulekh.gov.in/',
        isExternal: true
    },
    {
        id: '3',
        title: 'E-Courts (ई-कोर्ट यूपी)',
        descriptionHi: 'उत्तर प्रदेश के किसी भी व्यक्ति के केस स्टेटस, कोर्ट नोटिस और सुनवाई की जानकारी प्राप्त करें।',
        descriptionEn: 'Get case status, court notices, and hearing details for anyone in Uttar Pradesh.',
        icon: FaGavel,
        iconColor: '#9b59b6',
        category: 'legal',
        popularity: 4,
        path: 'https://ecourts.gov.in/ecourts_home/index.php?p=dist_court/up',
        isExternal: true
    },
    {
        id: '4',
        title: 'UP E-FIR Portal',
        descriptionHi: 'उत्तर प्रदेश पुलिस के साथ ऑनलाइन FIR दर्ज करें और अपनी शिकायत की स्थिति ट्रैक करें।',
        descriptionEn: 'Register online FIR with Uttar Pradesh Police and track the status of your complaint.',
        icon: FaClipboardCheck,
        iconColor: '#e67e22',
        category: 'legal',
        popularity: 4,
        path: 'https://cctnsup.gov.in/eFIR/login.aspx',
        isExternal: true
    },
    {
        id: '5',
        title: 'UP Vaad (राजस्व वाद)',
        descriptionHi: 'जमीन से संबंधित मुकदमों और राजस्व न्यायालय (Revenue Court) की केस डायरी देखें।',
        descriptionEn: 'View land-related cases and case diary of the Revenue Court.',
        icon: FaFileContract,
        iconColor: '#34495e',
        category: 'legal',
        popularity: 3,
        path: 'https://vaad.up.nic.in/',
        isExternal: true
    },
    {
        id: '6',
        title: 'Aadhaar Download',
        descriptionHi: 'UIDAI पोर्टल से अपना ओरिजिनल डिजिटल आधार कार्ड (e-Aadhaar) सुरक्षित रूप से डाउनलोड करें।',
        descriptionEn: 'Securely download your original digital Aadhaar card (e-Aadhaar) from the UIDAI portal.',
        icon: FaIdCard,
        iconColor: '#3498db',
        category: 'document',
        popularity: 5,
        path: 'https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en',
        isExternal: true
    },
    {
        id: '6-dup',
        title: 'm-Aadhaar Portal',
        descriptionHi: 'आधार की सभी ऑनलाइन सेवाओं जैसे एड्रेस अपडेट और PVC कार्ड आर्डर का प्रयोग करें।',
        descriptionEn: 'Use all online Aadhaar services like address update and PVC card ordering.',
        icon: FaIdCard,
        iconColor: '#3498db',
        category: 'document',
        popularity: 5,
        path: 'https://myaadhaar.uidai.gov.in/',
        isExternal: true
    },
    {
        id: '7',
        title: 'CSC Digital Seva',
        descriptionHi: 'जनसेवा केंद्र (CSC) संचालकों के लिए डिजिटल सेवा पोर्टल पर लॉगिन करने का लिंक।',
        descriptionEn: 'Login link for Common Service Center (CSC) operators to the Digital Seva Portal.',
        icon: FaLaptopCode,
        iconColor: '#1abc9c',
        category: 'service',
        popularity: 4,
        path: 'https://connect.csc.gov.in/account/authorize?response_type=code&client_id=0f8ca686-5a31-46b8-bb51-d9834ba9fa9d&redirect_uri=https%3A%2F%2Fdigitalseva.csc.gov.in%2Fauth%2Fcallback%2F&state=93746',
        isExternal: true
    },
    {
        id: '8',
        title: 'UP E-District',
        descriptionHi: 'आय, जाति और निवास प्रमाण पत्र जैसे सरकारी दस्तावेजों के आवेदन के लिए लॉगिन करें।',
        descriptionEn: 'Login to apply for government documents like Income, Caste, and Domicile certificates.',
        icon: FaFingerprint,
        iconColor: '#8e44ad',
        category: 'service',
        popularity: 4,
        path: 'https://edistrict.up.gov.in/edistrict/login/login.aspx',
        isExternal: true
    },
    {
        id: '9',
        title: 'Lekhpal Login (RCCMS)',
        descriptionHi: 'राजस्व अधिकारियों और लेखपालों के लिए राजस्व वाद निस्तारण हेतु लॉगिन पोर्टल।',
        descriptionEn: 'Login portal for Revenue Officers and Lekhpals for revenue case disposal.',
        icon: FaChartLine,
        iconColor: '#7f8c8d',
        category: 'service',
        popularity: 3,
        path: 'https://rccms.up.gov.in/dashboard/login/',
        isExternal: true
    },
    {
        id: '10',
        title: 'Image to Text OCR',
        descriptionHi: 'किसी भी स्कैन की गई फोटो या इमेज से टेक्स्ट को आसानी से निकालें और एडिट करें।',
        descriptionEn: 'Easily extract and edit text from any scanned photo or image.',
        icon: FaCamera,
        iconColor: '#f39c12',
        category: 'tool',
        popularity: 3,
        path: 'https://www.imagetotext.info/',
        isExternal: true
    },
    {
        id: '11',
        title: 'Indian Kanoon Search',
        descriptionHi: 'सुप्रीम कोर्ट, हाई कोर्ट और अन्य अदालतों के पुराने निर्णय और कानून सर्च करें।',
        descriptionEn: 'Search old judgments and laws of Supreme Court, High Court and other courts.',
        icon: FaSearch,
        iconColor: '#16a085',
        category: 'legal',
        popularity: 4,
        path: 'https://indiankanoon.org/search/',
        isExternal: true
    },
    {
        id: '12',
        title: 'Aadhaar NPCI Seeding',
        descriptionHi: 'बैंक खाते में आधार सीडिंग (DBT) और सरकारी सब्सिडी प्राप्त करने की स्थिति जांचें।',
        descriptionEn: 'Check the status of Aadhaar seeding (DBT) in bank account and government subsidy receipt.',
        icon: FaMoneyBill,
        iconColor: '#27ae60',
        category: 'document',
        popularity: 4,
        path: 'https://www.npci.org.in/',
        isExternal: true
    },
    {
        id: '13',
        title: 'E-Stamp Online',
        descriptionHi: 'विभिन्न कार्यों के लिए ऑनलाइन ई-स्टाम्प पेपर खरीदें और वेरिफिकेशन करें।',
        descriptionEn: 'Buy online e-stamp paper for various purposes and verify them.',
        icon: FaBalanceScale,
        iconColor: '#c0392b',
        category: 'document',
        popularity: 3,
        path: 'https://www.shcilestamp.com/OnlineStamping/',
        isExternal: true
    },
    {
        id: '14',
        title: 'Jhatpat Connection',
        descriptionHi: 'बिजली विभाग से नया कनेक्शन लेने या बिजली बिल सुधार के लिए उपयोग करें।',
        descriptionEn: 'Use for getting a new connection from the electricity department or for electricity bill correction.',
        icon: FaMoneyBill,
        iconColor: '#d35400',
        category: 'utility',
        popularity: 4,
        path: 'https://jhatpatportal.uppcl.org/jhatpat/auth/home/login',
        isExternal: true
    },
    {
        id: '15',
        title: 'PM-Kisan Portal',
        descriptionHi: 'किसान सम्मान निधि पंजीकरण, KYC और अपनी किस्तों का विवरण (Beneficiary Status) देखें।',
        descriptionEn: 'View Kisan Samman Nidhi registration, KYC and your installment details (Beneficiary Status).',
        icon: FaChartLine,
        iconColor: '#2ecc71',
        category: 'agriculture',
        popularity: 5,
        path: 'https://pmkisan.gov.in/homenew.aspx',
        isExternal: true
    },
    {
        id: '16',
        title: 'NSDL PAN Card',
        descriptionHi: 'नया पैन कार्ड (New PAN) बनाएं या अपने पुराने पैन कार्ड में नाम/फोटो सुधारें।',
        descriptionEn: 'Make a new PAN card or correct name/photo in your old PAN card.',
        icon: FaIdCard,
        iconColor: '#e67e22',
        category: 'document',
        popularity: 5,
        path: 'https://onlineservices.proteantech.in/paam/endUserRegisterContact.html',
        isExternal: true
    },
    {
        id: '18',
        title: 'Photo Compressor',
        descriptionHi: 'सरकारी फॉर्म अपलोड करने के लिए फोटो का साइज कम करें (50kb/100kb)।',
        descriptionEn: 'Reduce photo size (50kb/100kb) for uploading to government forms.',
        icon: FaChartLine,
        iconColor: '#d35400',
        category: 'tool',
        popularity: 5,
        path: 'https://image.pi7.org/compress-image-to-50kb',
        isExternal: true
    },
    {
        id: '19',
        title: 'Aadhaar Mobile Verify',
        descriptionHi: 'चेक करें कि आपके आधार कार्ड में कौन सा मोबाइल नंबर और ईमेल लिंक है।',
        descriptionEn: 'Check which mobile number and email is linked to your Aadhaar card.',
        icon: FaChartLine,
        iconColor: '#d35400',
        category: 'document',
        popularity: 5,
        path: 'https://myaadhaar.uidai.gov.in/verify-email-mobile/en',
        isExternal: true
    },
    {
        id: '20',
        title: 'IGRSUP (पंजीकरण)',
        descriptionHi: 'संपत्ति पंजीकरण, विवाह पंजीकरण और अन्य राजस्व सेवाओं के लिए उत्तर प्रदेश सरकार का पोर्टल।',
        descriptionEn: 'Uttar Pradesh government portal for property registration, marriage registration and other revenue services.',
        icon: FaChartLine,
        iconColor: '#d35400',
        category: 'service',
        popularity: 5,
        path: 'https://igrsup.gov.in/',
        isExternal: true
    },
    {
        id: '21',
        title: 'e-Courts e-Filing (ई-फाइलिंग)',
        descriptionHi: 'भारत के उच्च न्यायालय और जिला न्यायालयों में ऑनलाइन मामले दर्ज करने, दस्तावेज़ अपलोड करने और अन्य कानूनी प्रक्रियाओं के लिए आधिकारिक ई-फाइलिंग पोर्टल।',
        descriptionEn: 'Official e-Courts e-Filing portal of India for online filing of cases, applications, documents, and court fee payments before High Courts and District Courts.',
        icon: FaFileAlt,
        iconColor: '#2980b9',
        category: 'service',
        popularity: 5,
        path: 'https://filing.ecourts.gov.in/pdedev/',
        isExternal: true
    }
];

// Base Category data (colors only, names come from translations)
const categoryStyles = {
    all: '#3498db',
    land: '#27ae60',
    legal: '#9b59b6',
    document: '#e67e22',
    service: '#1abc9c',
    tool: '#f39c12',
    utility: '#d35400',
    agriculture: '#2ecc71',
    personal: '#ec4899'
};

const PortalGrid = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userPortals, setUserPortals] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [language, setLanguage] = useState('en'); // Default to English
    const userId = localStorage.getItem('lexai_userid');

    const t = translations[language];

    // Generate categories array based on language
    const categories = useMemo(() => {
        return Object.keys(categoryStyles).map(key => ({
            id: key,
            name: t.categories[key],
            color: categoryStyles[key]
        }));
    }, [t]);

    const [newPortal, setNewPortal] = useState({
        title: '',
        path: '',
        description: '',
        category: 'personal' // Default for custom
    });

    // Fetch User Portals
    useEffect(() => {
        if (!userId) return;

        const fetchPortals = async () => {
            try {
                const token = localStorage.getItem('lexai_token');
                const res = await fetch(`${API_BASE_URL}/users/${userId}/portals`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserPortals(data.map(p => ({
                        ...p,
                        isUserPortal: true,
                        isExternal: true, // User portals are usually external links
                        icon: FaFingerprint, // Default icon for custom
                        iconColor: '#ec4899',
                        category: 'personal'
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch user portals", err);
            }
        };

        fetchPortals();
    }, [userId]);

    const handleAddPortal = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert(t.loginAlert);
            return;
        }

        try {
            const token = localStorage.getItem('lexai_token');
            if (!token) {
                alert(t.authError);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/users/${userId}/portals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPortal)
            });

            if (res.ok) {
                const added = await res.json();
                setUserPortals([...userPortals, {
                    ...added,
                    isUserPortal: true,
                    isExternal: true,
                    icon: FaFingerprint,
                    iconColor: '#ec4899',
                    category: 'personal'
                }]);
                setIsAdding(false);
                setNewPortal({ title: '', path: '', description: '', category: 'personal' });
            } else {
                alert(t.addError);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePortal = async (e, portalId) => {
        e.stopPropagation();
        if (!window.confirm(t.deleteConfirm)) return;

        try {
            const token = localStorage.getItem('lexai_token');
            await fetch(`${API_BASE_URL}/users/${userId}/portals/${portalId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUserPortals(userPortals.filter(p => p.id !== portalId && p._id !== portalId));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    // Toggle Language
    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    };

    // Filter logic
    const filteredPortals = useMemo(() => {
        // Map default data to current language
        const localizedDefaults = defaultPortalData.map(p => ({
            ...p,
            description: language === 'en' ? p.descriptionEn : p.descriptionHi
        }));

        const allPortals = [...userPortals, ...localizedDefaults];
        return allPortals.filter(portal => {
            const matchesSearch = (portal.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (portal.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || portal.category === selectedCategory || (selectedCategory === 'personal' && portal.isUserPortal);
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory, userPortals, language]);

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>{t.title}</h1>
                        <p className={styles.subtitle}>{t.subtitle}</p>
                    </div>
                    <button onClick={toggleLanguage} className={styles.langBtn}>
                        <FaLanguage size={18} />
                        {language === 'en' ? 'हिंदी' : 'English'}
                    </button>
                </div>

                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className={styles.clearButton} onClick={() => setSearchTerm('')}>
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.filtersContainer}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`${styles.filterChip} ${selectedCategory === cat.id ? styles.active : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.name}
                    </button>
                ))}
                {userId && (
                    <button className={styles.addBtn} onClick={() => setIsAdding(!isAdding)}>
                        <FaPlus /> {t.addNew}
                    </button>
                )}
            </div>

            {/* Add Portal Form */}
            {isAdding && (
                <div className={styles.addFormContainer}>
                    <form onSubmit={handleAddPortal} className={styles.addForm}>
                        <h3>{t.addCustom}</h3>
                        <input
                            required
                            placeholder={t.portalTitle}
                            value={newPortal.title}
                            onChange={(e) => setNewPortal({ ...newPortal, title: e.target.value })}
                        />
                        <input
                            required
                            placeholder={t.websiteUrl}
                            value={newPortal.path}
                            onChange={(e) => setNewPortal({ ...newPortal, path: e.target.value })}
                        />
                        <input
                            placeholder={t.description}
                            value={newPortal.description}
                            onChange={(e) => setNewPortal({ ...newPortal, description: e.target.value })}
                        />
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.saveBtn}>{t.save}</button>
                            <button type="button" onClick={() => setIsAdding(false)} className={styles.cancelBtn}>{t.cancel}</button>
                        </div>
                    </form>
                </div>
            )}

            <main className={styles.portalGrid}>
                {filteredPortals.length > 0 ? (
                    filteredPortals.map(portal => (
                        <div key={portal.id || portal._id} className={styles.cardWrapper}>
                            <PortalCard
                                {...portal}
                                category={categories.find(c => c.id === portal.category) || { name: 'Personal', color: '#ec4899' }}
                                onClick={() => portal.isExternal ? window.open(portal.path, '_blank') : navigate(portal.path)}
                                actionLabel={portal.isExternal ? t.openPortal : t.viewService}
                            />
                            {portal.isUserPortal && (
                                <button className={styles.deleteBtn} onClick={(e) => handleDeletePortal(e, portal.id || portal._id)}>
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <h3>{t.noServices}</h3>
                        <p>{t.tryAdjusting}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PortalGrid;