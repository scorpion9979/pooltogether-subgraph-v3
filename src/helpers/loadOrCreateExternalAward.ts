import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import {
  ExternalErc20Award,
  ExternalErc721Award,
  ExternalErc721AwardToken,
} from '../../generated/schema'

import { externalAwardId, externalAwardTokenId } from './idTemplates'


export function loadOrCreateExternalErc20Award(prizeStrategyAddress: string, tokenAddress: Address): ExternalErc20Award {
  const awardId = externalAwardId(prizeStrategyAddress, tokenAddress.toHex())

  let award = ExternalErc20Award.load(awardId)
  if (!award) {
    award = new ExternalErc20Award(awardId)
    award.address = tokenAddress
    award.save()
  }

  return award as ExternalErc20Award
}

export function loadOrCreateExternalErc721Award(prizeStrategyAddress: string, tokenAddress: Address): ExternalErc721Award {
  const awardId = externalAwardId(prizeStrategyAddress, tokenAddress.toHex())

  let award = ExternalErc721Award.load(awardId)
  if (!award) {
    award = new ExternalErc721Award(awardId)
    award.address = tokenAddress
    award.save()
  }

  return award as ExternalErc721Award
}

export function loadOrCreateExternalErc721AwardToken(
  prizeStrategyAddress: string,
  tokenAddress: Address,
  tokenId: string
): ExternalErc721AwardToken {
  log.warning('prizeStrategyAddress {}', [prizeStrategyAddress])
  log.warning('tokenAddress {}', [tokenAddress.toString()])
  log.warning('tokenId {}', [tokenId])


  const awardTokenId = externalAwardTokenId(
    prizeStrategyAddress,
    tokenAddress.toHex(),
    tokenId
  )
  log.warning('awardTokenId {}', [awardTokenId])

  let token = ExternalErc721AwardToken.load(awardTokenId)
  if (!token) {
    token = new ExternalErc721AwardToken(awardTokenId)
    token.tokenId = Bytes.fromHexString(tokenId) as Bytes
    token.awarded = false
    token.save()
  }

  return token as ExternalErc721AwardToken
}
