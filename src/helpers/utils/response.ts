export type PagenationResponse = {
  metadata: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
    total_page: number;
    prevPage: number;
    nextPage: number;
  };
  list: any[];
};

export const paginatedResponse = (list: any[], total: number, page: number, limit: number): PagenationResponse => {
  const totalPage = Math.ceil(total / limit);
  return {
    metadata: {
      page,
      per_page: limit,
      count: list.length,
      total_count: total,
      total_page: totalPage,
      prevPage: page - 1 < 1 ? null : page - 1,
      nextPage: page + 1 > totalPage ? null : page + 1
    },
    list
  };
};
