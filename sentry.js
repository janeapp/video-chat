/* eslint-disable */
import * as Sentry from "@sentry/react"
import logger from './react/features/app/logger';

const SENTRY_DSN_KEY = process.env.SENTRY_DSN || "https://8b81f2744c0a5a73d15aa61497cd50a0@o4505290921410560.ingest.sentry.io/4505783957192704"

export const initSentry = () => {
    const releaseStage = process.env.NODE_ENV || "development"
    const version = process.env.APP_VERSION

    if (releaseStage === "production") {
        Sentry.init({
            dsn: SENTRY_DSN_KEY,
            integrations: [new Sentry.BrowserTracing()],
            environment: releaseStage,
            release: `jitsi-frontend@${version}`,
            tracesSampleRate: 1.0,
        })
        logger.info('Sentry has been initialized');
    }
}

export const notifySentry = (error)=>{
    if (Sentry) {
        Sentry.captureMessage(error)
    }
}

