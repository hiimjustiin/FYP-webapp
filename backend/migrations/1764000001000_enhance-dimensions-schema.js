/**
 * Migration: Enhance dimensions table schema
 * 
 * This migration improves the dimensions table by:
 * 1. Adding short_label for compact UI displays (charts, mobile)
 * 2. Adding description for tooltips/help text
 * 3. Replacing variant with color_hex for direct color values
 * 4. Adding rubric_level_1/2/3 criteria (moves from hardcoded AI config)
 * 5. Adding is_active flag for enabling/disabling dimensions
 * 6. Removing redundant display_order (always equals id)
 * 
 * Date: 2025-11-28
 */

export async function up(pgm) {
  // Add new columns
  pgm.addColumns('dimensions', {
    short_label: {
      type: 'varchar(50)',
      comment: 'Abbreviated label for charts and tight UI spaces',
    },
    description: {
      type: 'text',
      comment: 'Detailed description for tooltips and help text',
    },
    color_hex: {
      type: 'varchar(7)',
      notNull: true,
      default: '#6B7280',
      comment: 'Hex color code for UI display (e.g., #D71440)',
    },
    rubric_level_1: {
      type: 'text',
      comment: 'Level 1 (Naive/Novice) evaluation criteria',
    },
    rubric_level_2: {
      type: 'text',
      comment: 'Level 2 (Intermediate) evaluation criteria',
    },
    rubric_level_3: {
      type: 'text',
      comment: 'Level 3 (Mastery) evaluation criteria',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Whether this dimension is active and available for use',
    },
  });

  // Populate the new fields with data from the AI config
  pgm.sql(`
    UPDATE dimensions SET
      short_label = CASE id
        WHEN 1 THEN 'Problem Framing'
        WHEN 2 THEN 'Stakeholders'
        WHEN 3 THEN 'Disciplinary Range'
        WHEN 4 THEN 'Reasoning'
        WHEN 5 THEN 'Credibility'
        WHEN 6 THEN 'Integration Count'
        WHEN 7 THEN 'Integration Depth'
        WHEN 8 THEN 'Social Impact'
        WHEN 9 THEN 'Limitations'
      END,
      description = CASE id
        WHEN 1 THEN 'Evaluates whether the problem is framed with a clear purpose and articulated rationale'
        WHEN 2 THEN 'Assesses the number and diversity of stakeholders considered in the analysis'
        WHEN 3 THEN 'Measures the range of disciplinary perspectives incorporated'
        WHEN 4 THEN 'Evaluates the quality of reasoning used to explain disciplinary insights'
        WHEN 5 THEN 'Assesses the reliability and relevance of sources used'
        WHEN 6 THEN 'Counts instances where disciplinary insights build on each other to create new knowledge'
        WHEN 7 THEN 'Evaluates how well the relationships between disciplinary insights are explained'
        WHEN 8 THEN 'Assesses discussion of potential impacts on local community and broader society'
        WHEN 9 THEN 'Evaluates identification of limitations and proposed resolutions'
      END,
      color_hex = CASE id
        WHEN 1 THEN '#84CC16'
        WHEN 2 THEN '#EAB308'
        WHEN 3 THEN '#A855F7'
        WHEN 4 THEN '#14B8A6'
        WHEN 5 THEN '#3B82F6'
        WHEN 6 THEN '#6B7280'
        WHEN 7 THEN '#22C55E'
        WHEN 8 THEN '#181C62'
        WHEN 9 THEN '#EC4899'
      END,
      rubric_level_1 = CASE id
        WHEN 1 THEN 'No sense of purpose OR failed to articulate the rationale for conducting the project'
        WHEN 2 THEN '0 to 1 stakeholder considered'
        WHEN 3 THEN '0 to 1 disciplinary perspective considered'
        WHEN 4 THEN 'No reasoning provided to explain any disciplinary insights'
        WHEN 5 THEN 'Unreliable sources used'
        WHEN 6 THEN 'No evidence of disciplinary insights that build on one another to create new knowledge'
        WHEN 7 THEN 'No explanation of how the disciplinary insights are related to one another OR no visual representation of how the disciplinary insights are related to one another'
        WHEN 8 THEN 'No discussion on potential impacts'
        WHEN 9 THEN 'No identification of limitations in the project'
      END,
      rubric_level_2 = CASE id
        WHEN 1 THEN 'There is a clear purpose OR the rationale is articulated'
        WHEN 2 THEN '2 to 3 stakeholders considered'
        WHEN 3 THEN '2 to 3 disciplinary perspectives considered'
        WHEN 4 THEN 'Some reasoning provided to explain some disciplinary insights'
        WHEN 5 THEN 'Sometimes used relevant and reliable sources'
        WHEN 6 THEN '1 piece of evidence of disciplinary insights that build on one another to create new knowledge'
        WHEN 7 THEN 'Lists disciplinary insights without showing how they are related OR visual representation lists disciplinary insights without showing how they are related'
        WHEN 8 THEN 'Discussed potential impacts on local community OR broader society'
        WHEN 9 THEN 'Identified limitations but did not provide resolutions to address the limitations'
      END,
      rubric_level_3 = CASE id
        WHEN 1 THEN 'There is a clear purpose AND the rationale is articulated'
        WHEN 2 THEN 'More than 3 stakeholders considered'
        WHEN 3 THEN 'More than 3 disciplinary perspectives considered'
        WHEN 4 THEN 'Reasoning provided to explain all disciplinary insights'
        WHEN 5 THEN 'Always used relevant and reliable sources'
        WHEN 6 THEN 'At least 2 pieces of evidence of disciplinary insights that build on one another to create new knowledge'
        WHEN 7 THEN 'Explains how disciplinary insights build off one another OR visual representation shows how disciplinary insights build off one another'
        WHEN 8 THEN 'Discussed potential impacts on local community AND broader society, AND who will be affected'
        WHEN 9 THEN 'Identified limitations AND provided resolutions to address the limitations'
      END
    WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9);
  `);

  // Drop the old columns (variant and display_order are no longer needed)
  pgm.dropColumn('dimensions', 'variant');
  pgm.dropColumn('dimensions', 'display_order');
}

export async function down(pgm) {
  // Restore old columns
  pgm.addColumns('dimensions', {
    variant: {
      type: 'varchar(20)',
      notNull: true,
      default: "'grey'",
    },
    display_order: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
  });

  // Restore variant and display_order values
  pgm.sql(`
    UPDATE dimensions SET
      variant = CASE id
        WHEN 1 THEN 'lime'
        WHEN 2 THEN 'yellow'
        WHEN 3 THEN 'purple'
        WHEN 4 THEN 'teal'
        WHEN 5 THEN 'blue'
        WHEN 6 THEN 'grey'
        WHEN 7 THEN 'green'
        WHEN 8 THEN 'navy'
        WHEN 9 THEN 'pink'
      END,
      display_order = id
    WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9);
  `);

  // Drop new columns
  pgm.dropColumn('dimensions', 'short_label');
  pgm.dropColumn('dimensions', 'description');
  pgm.dropColumn('dimensions', 'color_hex');
  pgm.dropColumn('dimensions', 'rubric_level_1');
  pgm.dropColumn('dimensions', 'rubric_level_2');
  pgm.dropColumn('dimensions', 'rubric_level_3');
  pgm.dropColumn('dimensions', 'is_active');
}
