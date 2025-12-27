
import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    const userInfo = getCookie(event, 'userInfo')
    if (!userInfo) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    const user = JSON.parse(userInfo)
    const body = await readBody(event)

    const { roomName, organizationId, date, timeRange, purpose, remark } = body

    if (!roomName || !organizationId || !date || !timeRange || timeRange.length !== 2 || !purpose) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
    }

    const startTime = new Date(`${date}T${timeRange[0]}:00`)
    const endTime = new Date(`${date}T${timeRange[1]}:00`)

    try {
        const booking = await db.booking.create({
            data: {
                roomName,
                organizationId: Number(organizationId),
                userId: user.id,
                startTime,
                endTime,
                purpose,
                remark,
                status: 'pending'
            }
        })
        return booking
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
