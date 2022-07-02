import { Queue, Worker, QueueScheduler } from "bullmq"
import { logger } from "../utils/logger"
import IORedis from "ioredis"
import { REDIS_URL } from "../config"
import Email from "../entities/Email"

/**
 * Process email sending tasks at scheduled times.
 */
export class EmailQueue {
    public QUEUE_NAME = "processOrdersAndSendEmail"

    public queue: Queue
    public worker: Worker
    public queueScheduler: QueueScheduler
    public connection

    constructor() {
        logger.debug(
            `[EmailQueue] Initializing connection to Redis: ${REDIS_URL}`
        )

        this.connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
        })

        this.queueScheduler = new QueueScheduler(this.QUEUE_NAME, {
            connection: this.connection,
        })

        this.queue = new Queue(this.QUEUE_NAME, { connection: this.connection })

        this.worker = new Worker(
            this.QUEUE_NAME,
            async (job) => {
                logger.debug(
                    `*** Processing email, name: ${job.name}, ID = ${job.data} ***`
                )

                // update entry status and send email here:
                const [emails, count] = await Email.findAndCount({
                    skip: 0,
                    take: 10,
                    where: {
                        isProcessed: false,
                    },
                })

                logger.debug(
                    `[EmailQueue] A total of ${count} emails are not processed (process at most 10)`
                )
                for (const email of emails) {
                    email.isProcessed = true
                    await email.save()
                    // TODO email should be sent to users here, but this is just a demo
                    logger.info(
                        `[EmailQueue][email sent] Sending email to ${email.email}, order ID = ${email.orderId}, isSuccess = ${email.isSuccess}`
                    )
                }
            },
            { connection: this.connection }
        )

        this.worker.on("completed", (job) => {
            logger.debug(
                `[EmailQueue] ${job.id} has completed! email: ${job.data}`
            )
        })

        this.worker.on("failed", (job, err) => {
            logger.debug(
                `[EmailQueue] ${job.id} has failed with ${err.message}, email: ${job.data}`
            )
        })
    }

    /**
     * Process email after a delay.
     * @param emailId the email ID to process
     * @param delay delay in number to milliseconds
     */
    public async addJobToQueue(emailId: number, delay: number) {
        await this.queue.add(
            "check-orders-and-send-email-with-a-delay",
            emailId,
            {
                delay,
            }
        )
    }

    /**
     * Set up cron task to check and process emails regularly.
     */
    public async initializeRepeatableJob() {
        await this.queue.add("cron-check-orders-send-email", "cron", {
            repeat: {
                // cron: '* 15 3 * * *', // Repeat job once every day at 3:15 (am)
                cron: "0 */2 * * * *", // demo, every 2 minutes
            },
        })
    }

    /**
     * Close Redis connections gracefully.
     */
    public async closeRedisConnections() {
        await this.worker.close()
        await this.queue.close()
        await this.queueScheduler.close()
        await this.connection.disconnect()
        logger.debug(`Redis connections closed!`)
    }
}
