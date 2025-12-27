import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing user ID'
        })
    }

    try {
        const user = await db.user.findUnique({
            where: { id: parseInt(id) }
        })

        if (user?.account === 'system') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Cannot delete root administrator'
            })
        }

        await db.user.delete({
            where: { id: parseInt(id) }
        })

        return { message: 'User deleted successfully' }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
