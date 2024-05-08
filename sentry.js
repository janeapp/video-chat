/* eslint-disable */
import logger from './react/features/app/logger';

export const notifySentry = (error)=>{

}

export const initSentry = () => {
    const releaseStage = process.env.NODE_ENV;
    const version = process.env.APP_VERSION;
    const SENTRY_DSN_KEY = process.env.SENTRY_DSN || "https://8b81f2744c0a5a73d15aa61497cd50a0@o4505290921410560.ingest.sentry.io/4505783957192704";

    if (!SENTRY_DSN_KEY) {
        logger.warn('Sentry DSN is missing. Sentry will not be initialized.');
        return false;
    }

    if (navigator.product === 'ReactNative' || releaseStage !== "production") {
        logger.warn('Not in a valid environment. Sentry will not be initialized.');
        return false;
    }


    return true;
};
