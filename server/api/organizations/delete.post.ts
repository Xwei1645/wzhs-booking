import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Organization ID is required'
        })
    }

    try {
        await db.organization.delete({
            where: { id }
        })

        return { success: true }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
