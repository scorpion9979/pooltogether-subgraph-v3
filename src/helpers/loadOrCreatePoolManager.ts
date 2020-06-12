import { Address } from "@graphprotocol/graph-ts"
import {
  PrizePoolModuleManager as PrizePoolModuleManagerContract,
} from '../../generated/PrizePoolBuilder/PrizePoolModuleManager'
import {
  PoolManager,
} from '../../generated/schema'

export function loadOrCreatePoolManager(
  creator: Address,
  moduleManager: Address,
  prizeStrategy: Address,
): PoolManager {
  let poolManager = PoolManager.load(moduleManager.toHex())

  if (!poolManager) {
    poolManager = new PoolManager(moduleManager.toHex())
    const boundPoolManager = PrizePoolModuleManagerContract.bind(moduleManager)

    poolManager.creator = creator
    poolManager.prizeStrategy = prizeStrategy

    // poolManager.block = event.block.number

    poolManager.yieldService = boundPoolManager.yieldService()
    poolManager.ticket = boundPoolManager.ticket()
    poolManager.credit = boundPoolManager.credit()
    poolManager.sponsorship = boundPoolManager.sponsorship()
    poolManager.timelock = boundPoolManager.timelock()
    poolManager.prizePool = boundPoolManager.prizePool()
    poolManager.interestTracker = boundPoolManager.interestTracker()

    poolManager.save()
  }

  return poolManager as PoolManager
}
