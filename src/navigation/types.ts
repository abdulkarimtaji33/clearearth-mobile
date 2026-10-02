export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  PickupList: undefined;
  PickupDetail: { taskId: number };
  Profile: undefined;
};

export type InspectionStackParamList = {
  InspectionList: undefined;
  InspectionDetail: { id: number };
  InspectionReport: { id: number; dealId: number };
  Profile: undefined;
};
