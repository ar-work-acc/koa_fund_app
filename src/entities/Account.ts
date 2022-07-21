import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Index,
  OneToMany,
  CreateDateColumn,
} from "typeorm"
import Order from "./Order"

/**
 * Bank account.
 */
@Entity()
class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Index({ unique: true })
  @Column({ length: 63 })
  username!: string

  @Column({ select: false, length: 63 })
  password!: string

  @Column({ length: 63, default: "" })
  firstName!: string

  @Column({ length: 63, default: "" })
  lastName!: string

  @CreateDateColumn({ type: "timestamptz" })
  createdDate!: Date

  @Column({ type: "double precision" })
  balance!: number

  @Column({ default: false })
  isAgreementSigned!: boolean

  @Index({ unique: true })
  @Column({ length: 127 })
  email!: string

  @Column({ default: false })
  isAdmin!: boolean

  @OneToMany(() => Order, (order) => order.account, { cascade: true })
  orders!: Order[]
}

export default Account
