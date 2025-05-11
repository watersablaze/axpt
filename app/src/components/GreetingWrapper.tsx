import React, { FC, ReactNode } from 'react';
import styles from './GreetingWrapper.module.css'; // Assuming your CSS file is here

interface GreetingWrapperProps {
  partnerName: string;
  displayName?: string;
  children: ReactNode; 
}

const GreetingWrapper: FC<GreetingWrapperProps> = ({ partnerName, displayName, children }) => {
  const shownName = displayName || partnerName;
  
  return (
    <div className={styles.fullScreenWrapper}>
      <div className={styles.greetingWrapper}>
      <p className={styles.greetingText}>
  Welcome, {displayName}! You now have exclusive access to the AXPT.io Official Whitepaper.
</p>
      </div>
      <div className={styles.viewerSection}>
        {children} {/* ✅ This allows anything passed into GreetingWrapper to render here */}
      </div>
    </div>
  );
};

export default GreetingWrapper;