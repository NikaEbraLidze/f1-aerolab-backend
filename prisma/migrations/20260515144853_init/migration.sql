-- CreateTable
CREATE TABLE "Preset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "wingAngle" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "dragCoefficient" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);
