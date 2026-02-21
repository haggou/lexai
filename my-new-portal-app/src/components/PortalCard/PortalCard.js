import React from 'react';
import { FaExternalLinkAlt, FaArrowRight } from 'react-icons/fa';
import styles from './PortalCard.module.css';

const PortalCard = ({ id, title, description, icon: Icon, iconColor, path, isExternal, category, onClick, actionLabel }) => {
    return (
        <article className={styles.card} onClick={onClick}>
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper} style={{ color: iconColor }}>
                    <Icon />
                </div>
                <div className={styles.textContent}>
                    {category && (
                        <span className={styles.categoryTag} style={{ color: category.color, backgroundColor: `${category.color}15` }}>
                            {category.name}
                        </span>
                    )}
                    <h3 className={styles.title}>{title}</h3>
                </div>
            </div>

            <p className={styles.description}>{description}</p>

            <div className={styles.cardFooter}>
                <span>{actionLabel || (isExternal ? 'Open Portal' : 'View Service')}</span>
                {isExternal ? (
                    <FaExternalLinkAlt className={styles.actionIcon} />
                ) : (
                    <FaArrowRight className={styles.actionIcon} />
                )}
            </div>
        </article>
    );
};

export default PortalCard;

