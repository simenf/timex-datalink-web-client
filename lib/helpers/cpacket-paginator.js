/**
 * CPacket paginator utility
 * 
 * Paginates cpackets into chunks with headers and page numbers
 */

class CpacketPaginator {
  /**
   * Paginate cpackets into chunks
   * @param {Object} options - Pagination options
   * @param {Array<number>} options.header - Header bytes for each page
   * @param {number} options.length - Maximum length per page
   * @param {Array<number>} options.cpackets - Data to paginate
   * @returns {Array<Array<number>>} Paginated packets
   */
  static paginateCpackets({ header, length, cpackets }) {
    const pages = [];
    
    // Split cpackets into chunks of specified length
    for (let i = 0; i < cpackets.length; i += length) {
      const chunk = cpackets.slice(i, i + length);
      const pageNumber = Math.floor(i / length) + 1;
      
      // Create page with header, page number, and chunk data
      const page = [...header, pageNumber, ...chunk];
      pages.push(page);
    }
    
    return pages;
  }
}

export default CpacketPaginator;