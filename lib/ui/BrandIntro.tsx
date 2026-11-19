import { BrandLogo } from "./BrandLogo";
import styles from "./BrandIntro.module.css";

export function BrandIntro() {
  return (
    <div className={styles.intro} data-brand-intro-motion aria-hidden="true">
      <div className={styles.logo} data-brand-intro-motion>
        <BrandLogo />
      </div>
    </div>
  );
}
