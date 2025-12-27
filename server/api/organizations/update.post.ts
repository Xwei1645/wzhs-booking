import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id, name, description, userIds } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Organization ID is required'
        })
    }

    try {
        // Check if name exists for other organizations
        if (name) {
            const existingOrg = await db.organization.findFirst({
                where: {
                    name,
                    NOT: {
                        id
                    }
                }
            })

            if (existingOrg) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Organization name already exists'
                })
            }
        }

        const organization = await db.organization.update({
            where: { id },
            data: {
                name,
                description,
                users: userIds ? {
                    set: userIds.map((uid: number) => ({ id: uid }))
                } : undefined
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
