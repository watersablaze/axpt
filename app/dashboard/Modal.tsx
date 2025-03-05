import styles from "./Modal.module.css"; // ✅ Import styles

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalWrapper} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✖ Close
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;