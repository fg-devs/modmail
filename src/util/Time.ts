const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = (HOUR) * 24;
const WEEK = DAY * 7;

export default class Time {
  /**
   * @param {number} secs UNIX Epoch in seconds
   * @returns {Date}
   */
  public static toDate(secs: number): Date {
    return new Date(secs * 1000);
  }

  /**
   * @param {Date} date
   * @returns {number} UNIX Epoch in seconds
   */
  public static fromDate(date: Date): number {
    return date.getSeconds();
  }

  /**
   * @returns {number} UNIX Epoch in seconds
   */
  public static now(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * @param {string} moment
   * @returns {number} Unix Epoch timestamp in seconds
   * @throws {Error} if an invalid format was provided
   * @example
   * Time.parse("5w");
   */
  public static parse(moment: string): number {
    const rNumbers = moment.match(/[0-9]/g);
    const rLength = moment.match(/[A-z]/g);

    if (rNumbers === null) {
      throw new Error("A proper time wasn't provided");
    }

    if (rLength === null) {
      throw new Error("A length wasn't provided");
    }

    const length = rLength[0];
    const numbers = Number(rNumbers[0]);
    let res;

    switch (length) {
      case 'w':
        res = numbers * WEEK;
        break;
      case 'd':
        res = numbers * DAY;
        break;
      case 'h':
      case 'hr':
        res = numbers * HOUR;
        break;
      case 'm':
        res = numbers * MINUTE;
        break;
      case 's':
        res = numbers;
        break;
      default:
        throw new Error(`"${length}" is an invalid length`);
    }

    return Math.floor(res + Time.now());
  }
}
