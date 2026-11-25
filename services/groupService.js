const GroupRepository = require('../data/groupRepository');

class GroupService {
    static async createGroup(userId, { name, description, maxMembers }) {
        if (!name || name.trim() === '') {
            throw new Error('Group name is required');
        }

        // FIX: Added 'await' so groupId resolves to the actual integer ID
        const groupId = await GroupRepository.create(name, description, userId, maxMembers);

        // [AC-2] A student who creates a new study group becomes its owner and sees themselves in the members list
        // FIX: Added 'await' here as well
        await GroupRepository.addMember(userId, groupId);

        return await GroupRepository.findById(groupId);
    }

    static async getGroupDetails(groupId, userId) {
        const group = await GroupRepository.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        const members = await GroupRepository.listMembers(groupId);
        const meetings = await GroupRepository.listMeetingsByGroup(groupId);
        const userMembership = await GroupRepository.getMembership(userId, groupId);

        return {
            ...group,
            members,
            meetings,
            isMember: !!userMembership,
            isOwner: group.owner_id === userId
        };
    }

    static async listUserDashboard(userId) {
        const myGroups = await GroupRepository.listJoinedByUser(userId);
        const upcomingMeetings = await GroupRepository.listUpcomingByUser(userId);
        const openGroups = await GroupRepository.listNotJoinedByUser(userId);

        return {
            myGroups,
            upcomingMeetings,
            openGroups
        };
    }

    static async joinGroup(groupId, userId) {
        const group = await GroupRepository.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        // [AC-11] A student who attempts to join a group they are already a member of is refused with a 409 Conflict status and the message "Already a member"
        const existing = await GroupRepository.getMembership(userId, groupId);
        if (existing) {
            const error = new Error('Already a member');
            error.status = 409;
            throw error;
        }

        // [AC-3] A student who attempts to join a group that has reached its maximum member limit sees the message "This group is full" and cannot join
        const currentCount = await GroupRepository.countMembers(groupId);
        if (currentCount >= group.max_members) {
            const error = new Error('This group is full');
            error.status = 409;
            throw error;
        }

        // [AC-10] A student who clicks "Join Group" is successfully added to the group members list
        await GroupRepository.addMember(userId, groupId);
        return { success: true };
    }

    static async leaveGroup(groupId, userId) {
        const group = await GroupRepository.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        if (group.owner_id === userId) {
            const error = new Error('Owner cannot leave group');
            error.status = 403;
            throw error;
        }

        // [AC-5] A member who leaves a study group no longer sees that group's upcoming meetings on their dashboard
        await GroupRepository.removeMember(userId, groupId);
        return { success: true };
    }

    static async searchMaterials(query, userId) {
        const dashboard = await this.listUserDashboard(userId);
        return {
            query,
            results: []
        };
    }

    static async scheduleMeeting(groupId, userId, { title, startTime, endTime, location }) {
        const group = await GroupRepository.findById(groupId);
        if (!group) {
            throw new Error('Group not found');
        }

        // Authorization check: Only owner can schedule
        if (group.owner_id !== userId) {
            const error = new Error('Only the group owner can schedule meetings');
            error.status = 403;
            throw error;
        }

        // Basic validation
        if (!title || !startTime || !endTime || !location) {
            throw new Error('All meeting fields are required');
        }

        // [AC-4] An owner who schedules a meeting with past dates sees a validation error
        if (new Date(startTime) < new Date()) {
            throw new Error('Past dates not allowed');
        }

        if (new Date(startTime) >= new Date(endTime)) {
            throw new Error('Start time must be before end time');
        }

        // Overlap validation (Business rule for 409 Conflict)
        const overlap = await GroupRepository.findOverlappingMeeting(groupId, startTime, endTime);
        if (overlap) {
            const error = new Error('Meeting overlaps with an existing meeting');
            error.status = 409;
            throw error;
        }

        const meetingId = await GroupRepository.createMeeting(groupId, title, startTime, endTime, location);
        return { id: meetingId, success: true };
    }
}

module.exports = GroupService;