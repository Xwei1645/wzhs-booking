import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { name, description, userIds } = body

    if (!name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Organization name is required'
        })
    }

    try {
        const existingOrg = await db.organization.findUnique({
            where: { name }
        })

        if (existingOrg) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Organization name already exists'
            })
        }

        const organization = await db.organization.create({
            data: {
                name,
                description,
                users: {
                    connect: userIds?.map((uid: number) => ({ id: uid })) || []
                }
            }
        })

        return organization
    } catch (error: any) {
        if (error.statusCode) throw error
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
