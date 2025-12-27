
import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const userInfo = getCookie(event, 'userInfo')
    if (!userInfo) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = JSON.parse(userInfo)

    try {
        const bookings = await db.booking.findMany({
            where: {
                userId: user.id
            },
            include: {
                organization: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createTime: 'desc'
            }
        })

        return bookings.map(b => ({
            id: b.id,
            roomName: b.roomName,
            orgName: b.organization.name,
            startTime: b.startTime,
            endTime: b.endTime,
            purpose: b.purpose,
            status: b.status,
            remark: b.remark
        }))
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
