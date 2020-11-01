import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import {
  SingleRandomWinner,
  PrizeStrategy,
  PrizePool,
} from '../generated/schema'

import {
  Initialized,
  ControlledTokenAdded,
  ReserveFeeCaptured,
  LiquidityCapSet,
  Deposited,
  TimelockDeposited,
  Awarded,
  AwardedExternalERC20,
  AwardedExternalERC721,
  InstantWithdrawal,
  TimelockedWithdrawal,
  TimelockedWithdrawalSwept,
  CreditPlanSet,
  PrizeStrategySet,
  OwnershipTransferred,
} from '../generated/templates/PrizePool/PrizePool'

import {
  decrementPlayerCount,
  incrementPlayerCount,
  decrementPlayerBalance,
  incrementPlayerBalance,
  decrementSponsorBalance,
  incrementSponsorBalance,
  decrementPlayerTimelockedBalance,
  incrementPlayerTimelockedBalance,
  updateTotals
} from './helpers/prizePoolHelpers'

import { loadOrCreatePrize } from './helpers/loadOrCreatePrize'
import { loadOrCreatePlayer } from './helpers/loadOrCreatePlayer'
import { loadOrCreateSponsor } from './helpers/loadOrCreateSponsor'
import { loadOrCreatePrizePool } from './helpers/loadOrCreatePrizePool'
import { loadOrCreatePrizeStrategy } from './helpers/loadOrCreatePrizeStrategy'
import { loadOrCreatePrizePoolCreditRate } from './helpers/loadOrCreatePrizePoolCreditRate'
import {
  loadOrCreateExternalErc721Award,
  loadOrCreateExternalErc721AwardToken,
} from './helpers/loadOrCreateExternalAward'

import { ZERO, ZERO_ADDRESS } from './helpers/common'


export function handleInitialized(event: Initialized): void {
  const _prizePool = loadOrCreatePrizePool(event.address)
  _prizePool.reserveRegistry = event.params.reserveRegistry
  _prizePool.trustedForwarder = event.params.trustedForwarder
  _prizePool.maxExitFeeMantissa = event.params.maxExitFeeMantissa
  _prizePool.maxTimelockDuration = event.params.maxTimelockDuration
  _prizePool.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const _prizePool = loadOrCreatePrizePool(event.address)
  _prizePool.owner = event.params.newOwner
  _prizePool.save()
}

export function handleControlledTokenAdded(event: ControlledTokenAdded): void {
  // log.warning('implement handleControlledTokenAdded!', [])
}

export function handleLiquidityCapSet(event: LiquidityCapSet): void {
  const _prizePool = loadOrCreatePrizePool(event.address)
  _prizePool.liquidityCap = event.params.liquidityCap
  _prizePool.save()
}

export function handleCreditPlanSet(event: CreditPlanSet): void {
  const _creditRate = loadOrCreatePrizePoolCreditRate(event.address, event.params.token)
  _creditRate.creditLimitMantissa = event.params.creditLimitMantissa
  _creditRate.creditRateMantissa = event.params.creditRateMantissa
  _creditRate.save()
}

export function handlePrizeStrategySet(event: PrizeStrategySet): void {
  const _prizePoolAddress = event.address
  const _prizeStrategyAddress = event.params.prizeStrategy

  const _prizeStrategy = loadOrCreatePrizeStrategy(_prizeStrategyAddress, _prizePoolAddress)
  _prizeStrategy.singleRandomWinner = _prizeStrategyAddress.toHex()
  _prizeStrategy.save()

  const _prizePool = loadOrCreatePrizePool(_prizePoolAddress)
  _prizePool.prizeStrategy = _prizeStrategy.id
  _prizePool.save()
}

export function handleReserveFeeCaptured(event: ReserveFeeCaptured): void {
  const _prizePool = loadOrCreatePrizePool(event.address)
  _prizePool.cumulativePrizeReserveFee = _prizePool.cumulativePrizeReserveFee.plus(event.params.amount)
  _prizePool.save()

}

export function handleAwarded(event: Awarded): void {
  const _prizePool = loadOrCreatePrizePool(event.address)

  // Record prize history
  const _prize = loadOrCreatePrize(
    event.address.toHex(),
    _prizePool.currentPrizeId.toString()
  )
  _prize.amount = event.params.amount


  const winner = event.params.winner.toHex()
  if (winner != ZERO_ADDRESS) {
    const winnerBytes = Bytes.fromHexString(winner) as Bytes
    _prize.winners = [winnerBytes]

    const _player = loadOrCreatePlayer(event.address, Address.fromString(winner))
    _player.cumulativeWinnings = _player.cumulativeWinnings.plus(event.params.amount)
    incrementPlayerBalance(_player, event.params.amount)
    _player.save()
  }

  _prize.save()

  // Update Pool (Reserve Fee updated in handleReserveFeeCaptured)
  _prizePool.cumulativePrizeNet = _prizePool.cumulativePrizeNet.plus(event.params.amount)
  _prizePool.cumulativePrizeGross = _prizePool.cumulativePrizeNet.plus(_prizePool.cumulativePrizeReserveFee)
  _prizePool.save()
}

export function handleAwardedExternalERC20(event: AwardedExternalERC20): void {
  // TODO: implement this
  // This is emitted when external rewards (other tokens, etc)
  // are awarded
  log.warning('implement handleAwardedExternalERC20', [])
}

// This is emitted when external rewards (nfts, etc)
  // are awarded

// token 0xe9b4ad578264d16b55eb25e6eec1999306d912bd, data_source: PrizePool, runtime_host: 1 / 1, block_hash: 0xe3a51e25acd641db40cd4e10102dfce4a95312c33dae50776280bf6ac1ac44d3, block_number: 11102951

// index - 1, data_source: PrizePool, runtime_host: 1 / 1, block_hash: 0xe3a51e25acd641db40cd4e10102dfce4a95312c33dae50776280bf6ac1ac44d3, block_number: 11102951

// externalAward.id 0x029a9efdcdaac9e1f81a0498e8fd065ec500705b - 0xe9b4ad578264d16b55eb25e6eec1999306d912bd, data_source: SingleRandomWinner, runtime_host: 1 / 1, block_hash: 0xb16ee16ee142d02111329ec9c731e713a5df85b65353c4035f6733dde61f660b, block_number: 11102919

let ZERO_BI = BigInt.fromI32(0)
let ONE_BI = BigInt.fromI32(1)

export function handleAwardedExternalERC721(event: AwardedExternalERC721): void {
  log.warning('handleAwardedExternalERC721', [])

  const _prizePool = loadOrCreatePrizePool(event.address)

  const _prizeStrategyId = _prizePool.prizeStrategy
  const _prizeStrategy = SingleRandomWinner.load(_prizeStrategyId)

  const externalAward = loadOrCreateExternalErc721Award(
    _prizePool.prizeStrategy,
    event.params.token
  )

  const tokens = externalAward.tokens
  log.warning('tokens {}', [tokens.toString()])

  for (let i = ZERO_BI; i.lt(BigInt.fromI32(tokens.length)); i = i.plus(ONE_BI)) {
    let tt = tokens[i.toI32()]

    log.warning('tt {}', [tt])
  
    const _prizePool = loadOrCreatePrizePool(event.address)
    
    const token = loadOrCreateExternalErc721AwardToken(
      _prizePool.prizeStrategy,
      event.params.token,
      tt
    )

    token.awarded = true

    token.save()
  }
  externalAward.save()
  
  // event.params.tokenIds
  // log.warning('externalAward id {}', [externalAward.id.toString()])
  // log.warning('token {}', [event.params.token.toHexString()])

  // const externalErc721Awards = _prizeStrategy.externalErc721Awards
  // const index = externalErc721Awards.indexOf(externalAward.id, 0);
  // log.warning('index {}', [index.toString()])
  // if (index > -1) {
  //   log.warning('splicing', [])
  //   externalErc721Awards.splice(index, 1);
  // }
  // // delete externalErc721Awards[externalAward.id]
  // _prizeStrategy.externalErc721Awards = externalErc721Awards

  _prizeStrategy.save()
}

export function handleDeposited(event: Deposited): void {
  const _prizePoolAddress = event.address
  const _prizePool = loadOrCreatePrizePool(_prizePoolAddress)

  const _prizeStrategyId = _prizePool.prizeStrategy
  const _prizeStrategy = PrizeStrategy.load(_prizeStrategyId)

  const _singleRandomWinner = SingleRandomWinner.load(_prizeStrategy.singleRandomWinner)

  const tokenAddress = event.params.token
  const ticketAddress = Address.fromString(_singleRandomWinner.ticket)
  const ticketIsToken = (tokenAddress.equals(ticketAddress))

  if (ticketIsToken) {
    const _player = loadOrCreatePlayer(
      _prizePoolAddress,
      event.params.to
    )

    const playersCachedBalance = _player.balance
    incrementPlayerCount(_prizePool as PrizePool, playersCachedBalance)

    updateTotals(_prizePool as PrizePool)

    incrementPlayerBalance(_player, event.params.amount)

    _player.save()
  } else {
    const _sponsor = loadOrCreateSponsor(
      _prizePoolAddress,
      event.params.to
    )

    incrementSponsorBalance(_sponsor, event.params.amount)

    updateTotals(_prizePool as PrizePool)

    _sponsor.save()
  }

  _prizePool.save()
}

export function handleInstantWithdrawal(event: InstantWithdrawal): void {
  const _prizePoolAddress = event.address
  const _prizePool = loadOrCreatePrizePool(_prizePoolAddress)

  const _prizeStrategyId = _prizePool.prizeStrategy
  const _prizeStrategy = PrizeStrategy.load(_prizeStrategyId)

  const _singleRandomWinner = SingleRandomWinner.load(_prizeStrategy.singleRandomWinner)

  const ticket = _singleRandomWinner.ticket
  const token = event.params.token

  const ticketAddress = Address.fromString(ticket)
  const ticketIsToken = token.equals(ticketAddress)

  if (ticketIsToken) {
    const _player = loadOrCreatePlayer(
      _prizePoolAddress,
      event.params.from
    )

    decrementPlayerBalance(_player, event.params.amount)

    updateTotals(_prizePool as PrizePool)

    decrementPlayerCount(_prizePool as PrizePool, _player)

    _player.save()
  } else {
    const _sponsor = loadOrCreateSponsor(
      _prizePoolAddress,
      event.params.from
    )

    decrementSponsorBalance(_sponsor, event.params.amount)

    updateTotals(_prizePool as PrizePool)

    _sponsor.save()
  }

  _prizePool.save()
}

export function handleTimelockedWithdrawal(event: TimelockedWithdrawal): void {
  const _prizePoolAddress = event.address
  const _prizePool = loadOrCreatePrizePool(_prizePoolAddress)

  const _player = loadOrCreatePlayer(
    _prizePoolAddress,
    event.params.from
  )

  decrementPlayerCount(_prizePool as PrizePool, _player)

  decrementPlayerBalance(_player, event.params.amount)
  incrementPlayerTimelockedBalance(_player, event.params.amount)

  updateTotals(_prizePool as PrizePool)

  // This may need to be an association of many timelocked balances per player
  _player.unlockTimestamp = event.params.unlockTimestamp

  _player.save()
  _prizePool.save()
}

export function handleTimelockedWithdrawalSwept(event: TimelockedWithdrawalSwept): void {
  const _prizePoolAddress = event.address
  const _player = loadOrCreatePlayer(
    _prizePoolAddress,
    event.params.from
  )

  decrementPlayerTimelockedBalance(_player, event.params.amount)
  _player.unlockTimestamp = null

  _player.save()
}

// This happens when a player deposits some of their timelocked funds
// back into the pool
export function handleTimelockDeposited(event: TimelockDeposited): void {
  const _prizePoolAddress = event.address
  const _prizePool = loadOrCreatePrizePool(_prizePoolAddress)

  const _player = loadOrCreatePlayer(
    _prizePoolAddress,
    event.params.to
  )

  const playersCachedBalance = _player.balance
  incrementPlayerCount(_prizePool as PrizePool, playersCachedBalance)

  updateTotals(_prizePool as PrizePool)

  decrementPlayerTimelockedBalance(_player, event.params.amount)
  incrementPlayerBalance(_player, event.params.amount)

  if (_player.timelockedBalance.equals(ZERO)) {
    _player.unlockTimestamp = null
  }

  _player.save()
  _prizePool.save()
}
