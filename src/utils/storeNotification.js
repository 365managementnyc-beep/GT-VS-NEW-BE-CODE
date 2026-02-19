const Notification = require('../models/Notification');
const NotificationPermission = require('../models/NotificationPermission');
const User = require('../models/users/User');
const Email = require('./email');
const { sendTwilioSms } = require('./sendTwilioSms');
const { getIO } = require('./socket');

const sendEmail = async (user, title, message) => {
  const emailInstance = new Email(user.email, user.firstName);
  await emailInstance.sendTextEmail(title, message, { attachment: null });
};

const sendNotification = async ({ userId, title, message, type, fortype, permission: tab, linkUrl }) => {
  console.log('Sending notification:', { userId, title, message, type, fortype, tab, linkUrl });
  try {
    const io = getIO();
    const user = await User.findById(userId);
    if (!user) {
      return;
    }
    console.log('Sending notification to user:', user, fortype);

    // Admin Notification Handling
    if (user.role === 'admin' && fortype) {
      const permissions = await NotificationPermission.findOne({ type: fortype });
      console.log('Admin notification permissions:', permissions);

      if (!permissions) {
        console.log('Notification permission not found for type:', fortype);
        return;
      }

      // Email
      if (permissions.email === true) {
        if (permissions.admin) {
          await sendEmail(user, title, message);
        }
        if (permissions.subadmin) {
          const subAdmins = await User.find({ adminRole: 'subAdmin' }).populate('templateId');
          for (const subAdmin of subAdmins) {
            if (subAdmin.email && subAdmin?.templateId?.tabPermissions?.includes(tab)) {
              await sendEmail(subAdmin, title, message);
            }
          }
        }
      }

      // SMS
      if (permissions.sms === true) {
        if (permissions.subadmin === true) {
          const subAdmins = await User.find({ adminRole: 'subAdmin' }).populate('templateId');
          for (const subAdmin of subAdmins) {
            if (subAdmin.contact && subAdmin?.templateId?.tabPermissions?.includes(tab)) {
              const smsResponse = await sendTwilioSms(subAdmin.contact, message);
            }
          }
          if (permissions.admin === true) {
            const smsResponse = await sendTwilioSms(user.contact, message);
          }
        }
      }

      console.log('Permissions:..........', permissions);
      // Mobile Notification
      if (permissions.mobile === true) {
        if (permissions.admin === true) {
          const notification = new Notification({ userId: user._id, title, message, type , linkUrl });
          await notification.save();
          io.to('notification_admin').emit('notification', notification);
        }

        if (permissions.subadmin === true) {
          const subAdmins = await User.find({ adminRole: 'subAdmin' }).populate('templateId');
          console.log('Subadmin notification permissions:', tab);
          for (const subAdmin of subAdmins) {
            console.log('Checking subAdmin:', subAdmin._id, subAdmin?.templateId?.tabPermissions);
            if (subAdmin?.templateId?.tabPermissions?.includes(tab)) {
              const subNotification = new Notification({
                userId: subAdmin._id,
                title,
                message,
                type,
                linkUrl
                
              });
              await subNotification.save();
              io.to(`notification_subAdmin_${subAdmin?._id}`).emit('notification', subNotification);
            }
          }
        }
      }

      return 0;
    }

    await sendEmail(user, title, message);

    // if (user.contact) {
    //   const smsResponse = await sendTwilioSms(user.contact, message);
    //   console.log('SMS sent:', smsResponse);
    // }

    const newNotification = new Notification({
      userId: user._id,
      title,
      message,
      type,
      linkUrl
    });

    await newNotification.save();

    const room = io.sockets.adapter.rooms.get(user._id.toString());
    if (room) {
      newNotification.isDelivered = true;
      await newNotification.save();
      io.to(user._id.toString()).emit('notification', newNotification);
    }
  } catch (error) {
    console.error('Notification middleware error:', error);
    throw error;
  }
};

module.exports = sendNotification;
