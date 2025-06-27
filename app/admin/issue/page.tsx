'use client';
import TokenIssueForm from '@/components/admin/TokenIssueForm';
import styles from '@/styles/AdminTokens.module.css';

export default function AdminIssueToken() {
  return (
    <div className={styles.container}>
      <h1>🎟️ Issue a New Token</h1>
      <TokenIssueForm onIssue={() => {
        // This callback can be used to refresh the token list or display confirmation
        console.log('Token issued!');
      }} />
    </div>
  );
}