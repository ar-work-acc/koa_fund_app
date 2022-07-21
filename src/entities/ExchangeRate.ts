import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm"

/**
 * Exchange rate for a currency (USD to that currency).
 */
@Entity()
class ExchangeRate extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  // a small integer would be better, but it's just a demo
  @Column({ length: 15 })
  currency!: string

  @Column({ type: "double precision", default: 1.0 })
  rate!: number

  @Column({ type: "timestamptz" })
  date!: Date
}

export default ExchangeRate
