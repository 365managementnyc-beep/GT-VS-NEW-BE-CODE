const getPermissionsByUserType = (userType, plan) => {
  // FIXME: will be updated maybe in future for relevant permissions
  const permissions = {
    student: {
      free: {
        ads: true,
        storageLimit: 1,
        maxTopicsPerDay: 3,
        customization: false,
        handsUpLimit: 1,
        gifsEnabled: false,
        priorityVisibility: false
      },
      premium: {
        ads: false,
        storageLimit: 4,
        maxTopicsPerDay: 10,
        customization: true,
        handsUpLimit: 1,
        gifsEnabled: true,
        priorityVisibility: true
      }
    },
    musician: {
      free: {
        ads: true,
        storageLimit: 1,
        maxTopicsPerDay: 3,
        customization: false,
        handsUpLimit: 1,
        gifsEnabled: false,
        priorityVisibility: false
      },
      essential: {
        ads: false,
        storageLimit: 5,
        maxTopicsPerDay: 10,
        customization: true,
        handsUpLimit: 2,
        gifsEnabled: true,
        priorityVisibility: true
      },
      professional: {
        ads: false,
        storageLimit: 10,
        maxTopicsPerDay: 20,
        customization: true,
        handsUpLimit: 3,
        gifsEnabled: true,
        priorityVisibility: true
      }
    },
    contractor: {
      free: {
        ads: true,
        storageLimit: 1,
        maxTopicsPerDay: 3,
        customization: false,
        handsUpLimit: 1,
        gifsEnabled: false,
        priorityVisibility: false
      },
      essential: {
        ads: false,
        storageLimit: 5,
        maxTopicsPerDay: 10,
        customization: true,
        handsUpLimit: 2,
        gifsEnabled: true,
        priorityVisibility: true
      },
      professional: {
        ads: false,
        storageLimit: 10,
        maxTopicsPerDay: 20,
        customization: true,
        handsUpLimit: 3,
        gifsEnabled: true,
        priorityVisibility: true
      }
    }
  };

  return permissions[userType][plan];
};

module.exports = getPermissionsByUserType;
