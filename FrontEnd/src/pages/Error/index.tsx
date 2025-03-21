import React from "react";
import styles from "./Error.module.css";

const Error = () => {
    return (
        <div id={styles.notfound}>
            <div className={styles.notfound}>
                <div className={styles.notfound_404}></div>
                <h1>404</h1>
                <h2>Oops! Page Not Found</h2>
                <p>
                    Sorry, but the page you are looking for does not exist, has been
                    removed, name changed, or is temporarily unavailable.
                </p>
                <a href="/">Back to homepage</a>
            </div>
        </div>
    );
};

export default Error;
