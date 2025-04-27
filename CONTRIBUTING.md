# 🤝 Contributing to AXPT.io

Thank you for your interest in contributing to this project! This platform is built to scale beautifully and collaboratively. To keep things clear and efficient, here are a few guidelines:

---

## 📂 File Organization & Imports

We use **path aliases** to keep our import statements clean and readable.

### ✅ Aliases Available:

| Alias               | Maps To                |
|----------------------|------------------------|
| `@/components/*`     | `app/components/*`     |
| `@/styles/*`         | `app/styles/*`         |
| `@/lib/*`            | `app/lib/*`            |
| `@/api/*`            | `app/api/*`            |
| `@/scripts/*`        | `scripts/*`            |

🔹 **Example:**
```tsx
import GreetingWrapper from '@/components/GreetingWrapper';
import styles from '@/styles/Whitepaper.module.css';