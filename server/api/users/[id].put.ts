import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { name, role, status } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing user ID'
        })
    }

    try {
        const user = await db.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                role,
                status
            }
        })

        return {
            id: user.id,
            account: user.account,
            name: user.name,
            role: user.role,
            status: user.status,
            createTime: user.createTime
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
