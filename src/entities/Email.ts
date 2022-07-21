import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm"

/**
 * Just a list of e-mail that should be sent to users later, possibly by another system.
 * Fields are not normalized.
 * Maybe the other system has restricted access and can only access this table.
 */
@Entity()
export default class Email extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 127 })
  email!: string // target user's email; again, NOT normalized

  @Column()
  orderId!: number // order ID

  @Column()
  isSuccess!: boolean // is the order successfully processed or not

  @Column({ default: false })
  isProcessed!: boolean // mark true after you sent the notification mail
}
