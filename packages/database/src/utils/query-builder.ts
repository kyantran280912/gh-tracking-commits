/**
 * QueryBuilder - Utility for building dynamic SQL queries with parameterized values
 * Helps reduce code duplication and prevent SQL injection
 */
export class QueryBuilder {
  private conditions: string[] = [];
  private params: any[] = [];
  private paramIndex = 1;

  /**
   * Add a WHERE condition
   * @param field - Database column name
   * @param value - Value to compare (if undefined, condition is skipped)
   * @param operator - Comparison operator (default: '=')
   */
  where(
    field: string,
    value: any,
    operator: '=' | 'ILIKE' | '>=' | '<=' | '!=' = '='
  ): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(`${field} ${operator} $${this.paramIndex++}`);
      this.params.push(operator === 'ILIKE' ? `%${value}%` : value);
    }
    return this;
  }

  /**
   * Add a raw WHERE condition with custom SQL
   * @param condition - Raw SQL condition with $N placeholders
   * @param values - Values for the placeholders
   */
  whereRaw(condition: string, ...values: any[]): this {
    if (values.length > 0) {
      // Replace $N placeholders with current param index
      let adjustedCondition = condition;
      values.forEach((value, idx) => {
        adjustedCondition = adjustedCondition.replace(
          `$${idx + 1}`,
          `$${this.paramIndex++}`
        );
        this.params.push(value);
      });
      this.conditions.push(adjustedCondition);
    }
    return this;
  }

  /**
   * Get the current parameter index (useful for adding LIMIT/OFFSET)
   */
  getNextParamIndex(): number {
    return this.paramIndex;
  }

  /**
   * Build the WHERE clause and parameters
   */
  build(): { whereClause: string; params: any[]; paramCount: number } {
    return {
      whereClause:
        this.conditions.length > 0
          ? ` WHERE ${this.conditions.join(' AND ')}`
          : '',
      params: this.params,
      paramCount: this.params.length,
    };
  }

  /**
   * Reset the builder for reuse
   */
  reset(): this {
    this.conditions = [];
    this.params = [];
    this.paramIndex = 1;
    return this;
  }
}
