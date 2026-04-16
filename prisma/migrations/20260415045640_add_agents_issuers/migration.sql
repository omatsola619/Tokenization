-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "kycProviderId" TEXT,
    "identityAddress" TEXT,
    "identityRegistered" BOOLEAN NOT NULL DEFAULT false,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "address" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "identityAddress" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "claimId" TEXT,
    "issuer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "totalSupply" BIGINT NOT NULL DEFAULT 0,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "transactions" (
    "txHash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("txHash")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances" (
    "wallet" TEXT NOT NULL,
    "amount" BIGINT NOT NULL DEFAULT 0,
    "frozen" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balances_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "agents" (
    "wallet" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "trusted_issuers" (
    "wallet" TEXT NOT NULL,
    "topics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_issuers_pkey" PRIMARY KEY ("wallet")
);

-- CreateIndex
CREATE UNIQUE INDEX "investors_walletAddress_key" ON "investors"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "events_txHash_logIndex_key" ON "events"("txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_wallet_fkey" FOREIGN KEY ("wallet") REFERENCES "investors"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
