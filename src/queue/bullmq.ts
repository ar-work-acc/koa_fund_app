import { Queue, Worker, QueueScheduler, Job } from "bullmq"
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
    public connection: IORedis.Redis

    constructor() {
        logger.debug(`Initializing connection to Redis: ${REDIS_URL}`)
        // get a Redis connection:
        this.connection = new IORedis(REDIS_URL, {
            maxRetriesPerRequest: null,
        })

        // create queue scheduler, queue, and works with connections:
        // queue scheduler:
        this.queueScheduler = new QueueScheduler(this.QUEUE_NAME, {
            connection: this.connection,
        })

        // queue:
        this.queue = new Queue(this.QUEUE_NAME, { connection: this.connection })

        // worker:
        this.worker = new Worker(
            this.QUEUE_NAME,
            async (job: Job) => {
                const jobInfo = `job name: ${
                    job.name
                }, job data = ${JSON.stringify(job.data)}`

                if (job.data == "cron") {
                    logger.debug(`*** Processing email, ${jobInfo} ***`)
                    EmailQueue.processAndSendEmails()
                } else {
                    logger.debug(`*** Doing nothing, ${jobInfo} ***`)
                }
            },
            { connection: this.connection }
        )
        this.worker.on("completed", (job) => {
            logger.debug(
                `${job.id} has completed! job data: ${job.data}`
            )
        })
        this.worker.on("failed", (job, err) => {
            logger.debug(
                `${job.id} has failed with ${err.message}, job data: ${job.data}`
            )
        })
    }

    /**
     * Process and send emails. For cron.
     */
    public static async processAndSendEmails() {
        // update entry status and send email here:
        const [emails, count] = await Email.findAndCount({
            skip: 0,
            take: 10,
            where: {
                isProcessed: false,
            },
        })

        logger.debug(
            `A total of ${count} emails are not processed (process at most 10)`
        )
        for (const email of emails) {
            email.isProcessed = true
            await email.save()
            // TODO email should be sent to users here, but this is just a demo
            logger.info(
                `*** Sending email to ${email.email}, order ID = ${email.orderId}, isSuccess = ${email.isSuccess} ***`
            )
        }
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
