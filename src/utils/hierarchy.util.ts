export const buildHierarchyData = (user: any) => {
  switch (user.role) {
    case "company":
      return {
        companyId: user.id,
        branchId: null,
        supervisorId: null,
        salesmanId: null,
      };

    case "branch":
      return {
        companyId: user.companyId,
        branchId: user.id,
        supervisorId: null,
        salesmanId: null,
      };

    case "supervisor":
      return {
        companyId: user.companyId,
        branchId: user.branchId,
        supervisorId: user.id,
        salesmanId: null,
      };

    case "salesman":
      return {
        companyId: user.companyId,
        branchId: user.branchId,
        supervisorId: user.supervisorId,
        salesmanId: user.id,
      };

    default:
      return {};
  }
};


export const buildLeadFilter = (user: any, queryParams: any) => {
  let query: any = {};

  switch (user.role) {
    case "superadmin":
      break;
    case "company":
      query.companyId = user.id;
      break;
    case "branch":
      query.branchId = user.id;
      break;
    case "supervisor":
      query.supervisorId = user.id;
      break;
    case "salesman":
      query.salesmanId = user.id;
      break;
  }

  // Extra filters
  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.companyId) query.companyId = queryParams.companyId;
  if (queryParams.branchId) query.branchId = queryParams.branchId;
  if (queryParams.supervisorId) query.supervisorId = queryParams.supervisorId;
  if (queryParams.salesmanId) query.salesmanId = queryParams.salesmanId;

  return query;
};