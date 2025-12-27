
export default defineEventHandler(async (event) => {
    const userInfo = getCookie(event, 'userInfo')

    if (!userInfo) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Not authenticated'
        })
    }

    try {
        const parsed = JSON.parse(userInfo)
        const user = await db.user.findUnique({
            where: { id: parsed.id },
            include: {
                organizations: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'User not found'
            })
        }

        return {
            id: user.id,
            account: user.account,
            name: user.name,
            role: user.role,
            organizations: user.organizations
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
