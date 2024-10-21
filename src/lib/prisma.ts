import {PrismaClient} from "@prisma/client"

const prismaClientSingleton  = ()=>{
    return new PrismaClient()
};

declare global{
    var primaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.primaGlobal ?? prismaClientSingleton()

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.primaGlobal = prisma;