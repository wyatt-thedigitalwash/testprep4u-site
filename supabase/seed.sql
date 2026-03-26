-- ============================================================
-- seed.sql — FL Life Insurance course structure
-- 30-hour program, 6 sections, 24 SCORM modules
-- ============================================================

-- ── Course ──────────────────────────────────────────────────

insert into public.courses (id, slug, name, type, state, required_hours)
values (
  '00000000-0000-0000-0000-000000000001',
  'fl-life',
  'Florida Life Insurance',
  'life',
  'FL',
  30
);

-- ── Section 0: Course Introduction ──────────────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  0, 'Course Introduction', 0
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order) values
  ('10000000-0000-0000-0000-000000000000', 'lesson', 'Course Introduction',
   'scorm/fl-life/part0/Course Introduction/scormdriver/indexAPI.html', 1);

-- ── Section 1: General Insurance Concepts ───────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  1, 'General Insurance Concepts', 1
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order, quiz_pass_score) values
  ('10000000-0000-0000-0000-000000000001', 'lesson', 'Chapter 1: Purpose of Life Insurance',
   'scorm/fl-life/part1/Chapter 1 Purpose of Life Insurance/scormdriver/indexAPI.html', 1, null),
  ('10000000-0000-0000-0000-000000000001', 'lesson', 'Chapter 2: The Insurance Industry',
   'scorm/fl-life/part1/Chapter 2 The Insurance Industry/scormdriver/indexAPI.html', 2, null),
  ('10000000-0000-0000-0000-000000000001', 'lesson', 'Chapter 3: Law and the Insurance Contract',
   'scorm/fl-life/part1/Chapter 3 Law and the Insurance Contract/scormdriver/indexAPI.html', 3, null),
  ('10000000-0000-0000-0000-000000000001', 'lesson', 'Chapter 4: Licensure, Ethics, and the Insurance Producer',
   'scorm/fl-life/part1/Chapter 4 Licensure Ethics and the Insurance Producer/scormdriver/indexAPI.html', 4, null),
  ('10000000-0000-0000-0000-000000000001', 'quiz', 'Part 1 Quiz',
   'scorm/fl-life/part1/Part 1 Quiz/scormdriver/indexAPI.html', 5, 70);

-- ── Section 2: Life Insurance Products ──────────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  2, 'Life Insurance Products', 2
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order, quiz_pass_score) values
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 1: Life Insurance Policies',
   'scorm/fl-life/part2/Chapter 1 Life Insurance Policies/scormdriver/indexAPI.html', 1, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 2: Life Insurance Policy Provisions, Options, and Riders',
   'scorm/fl-life/part2/Chapter 2 Life Insurance Policy Provisions Options and Riders/scormdriver/indexAPI.html', 2, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 3: Life Insurance Beneficiaries',
   'scorm/fl-life/part2/Chapter 3 Life Insurance Beneficiaries/scormdriver/indexAPI.html', 3, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 4: Life Insurance Premiums and Proceeds',
   'scorm/fl-life/part2/Chapter 4 Life Insurance Premiums and Proceeds/scormdriver/indexAPI.html', 4, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 5: Life Insurance Underwriting and Policy Issue',
   'scorm/fl-life/part2/Chapter 5 Life Insurance Underwriting and Policy Issue/scormdriver/indexAPI.html', 5, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 6: Group Life Insurance',
   'scorm/fl-life/part2/Chapter 6 Group Life Insurance/scormdriver/indexAPI.html', 6, null),
  ('10000000-0000-0000-0000-000000000002', 'lesson', 'Chapter 7: Annuities',
   'scorm/fl-life/part2/Chapter 7 Annuities/scormdriver/indexAPI.html', 7, null),
  ('10000000-0000-0000-0000-000000000002', 'quiz', 'Part 2 Quiz',
   'scorm/fl-life/part2/Part 2 Quiz/scormdriver/indexAPI.html', 8, 70);

-- ── Section 3: Social Security & Retirement ─────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  3, 'Social Security & Retirement', 3
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order, quiz_pass_score) values
  ('10000000-0000-0000-0000-000000000003', 'lesson', 'Chapter 1: Social Security',
   'scorm/fl-life/part3/Chapter 1 Social Security/scormdriver/indexAPI.html', 1, null),
  ('10000000-0000-0000-0000-000000000003', 'lesson', 'Chapter 2: Retirement Plans',
   'scorm/fl-life/part3/Chapter 2 Retirement Plans/scormdriver/indexAPI.html', 2, null),
  ('10000000-0000-0000-0000-000000000003', 'lesson', 'Chapter 3: Uses of Life Insurance',
   'scorm/fl-life/part3/Chapter 3 Uses of Life Insurance/scormdriver/indexAPI.html', 3, null),
  ('10000000-0000-0000-0000-000000000003', 'quiz', 'Part 3 Quiz',
   'scorm/fl-life/part3/Part 3 Quiz/scormdriver/indexAPI.html', 4, 70);

-- ── Section 4: Florida Laws & Rules ─────────────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  4, 'Florida Laws & Rules', 4
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order, quiz_pass_score) values
  ('10000000-0000-0000-0000-000000000004', 'lesson', 'Chapter 1: Florida Laws and Rules Pertinent to Life Insurance — Regulatory Foundations',
   'scorm/fl-life/part4/Chapter 1 Florida Laws and Rules Pertinent to Life Insurance - Regulatory Foundations/scormdriver/indexAPI.html', 1, null),
  ('10000000-0000-0000-0000-000000000004', 'lesson', 'Chapter 2: Florida Replacement Rule',
   'scorm/fl-life/part4/Chapter 2 Florida Replacement Rule/scormdriver/indexAPI.html', 2, null),
  ('10000000-0000-0000-0000-000000000004', 'lesson', 'Chapter 3: Florida Laws and Rules Pertinent to Variable Contracts',
   'scorm/fl-life/part4/Chapter 3 Florida Laws and Rules Pertinent to Variable Contracts/scormdriver/indexAPI.html', 3, null),
  ('10000000-0000-0000-0000-000000000004', 'quiz', 'Part 4 Quiz',
   'scorm/fl-life/part4/Part 4 Quiz/scormdriver/indexAPI.html', 4, 70);

-- ── Section 5: Exam Preparation ─────────────────────────────

insert into public.course_sections (id, course_id, section_number, title, sort_order)
values (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  5, 'Exam Preparation', 5
);

insert into public.course_modules (section_id, module_type, title, scorm_entry_path, sort_order) values
  ('10000000-0000-0000-0000-000000000005', 'lesson', 'Preparing for the Course Exam',
   'scorm/fl-life/course-exam-prep/Preparing for the Course Exam/scormdriver/indexAPI.html', 1),
  ('10000000-0000-0000-0000-000000000005', 'lesson', 'Preparing for the Florida State Exam',
   'scorm/fl-life/state-exam-readiness/Preparing for the Florida State Exam/scormdriver/indexAPI.html', 2);

-- ── Sample Questions: Part 1 Quiz (General Insurance Concepts) ──

insert into public.question_bank (course_id, topic, question_text, options, correct_index, explanation, exam_type) values

-- Purpose of Life Insurance (3 questions)
('00000000-0000-0000-0000-000000000001',
 'Chapter 1: Purpose of Life Insurance',
 'What is the primary purpose of life insurance?',
 '["To provide a savings vehicle for retirement", "To replace income lost due to the insured''s death", "To pay for medical expenses during illness", "To build equity in a property"]',
 1,
 'Life insurance is primarily designed to replace the income or financial contribution lost when the insured person dies, ensuring dependents are financially protected.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 1: Purpose of Life Insurance',
 'Which approach to determining life insurance needs calculates the present value of an individual''s future net earnings?',
 '["Needs approach", "Human life value approach", "Income replacement approach", "Capital retention approach"]',
 1,
 'The human life value approach calculates the present value of the individual''s future earning potential minus personal consumption, representing the economic loss to dependents upon death.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 1: Purpose of Life Insurance',
 'Which risk does life insurance primarily protect against?',
 '["Property risk", "Liability risk", "Premature death risk", "Market risk"]',
 2,
 'Life insurance is specifically designed to protect against the financial consequences of premature death — the risk that someone dies before building adequate financial resources for dependents.',
 'both'),

-- The Insurance Industry (3 questions)
('00000000-0000-0000-0000-000000000001',
 'Chapter 2: The Insurance Industry',
 'Which type of insurance company is owned by its policyholders?',
 '["Stock company", "Mutual company", "Reciprocal exchange", "Lloyd''s association"]',
 1,
 'A mutual insurance company is owned by its policyholders, who may receive dividends as a return of excess premiums. Stock companies are owned by shareholders.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 2: The Insurance Industry',
 'What is the role of an insurance underwriter?',
 '["To sell insurance policies to the public", "To investigate insurance claims", "To evaluate and classify risks for insurance coverage", "To manage investment portfolios for the insurer"]',
 2,
 'An underwriter evaluates applications for insurance and determines whether to accept, reject, or modify coverage based on the level of risk the applicant presents.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 2: The Insurance Industry',
 'Which principle states that insurance should restore the insured to the same financial position as before the loss?',
 '["Principle of utmost good faith", "Principle of indemnity", "Principle of subrogation", "Principle of estoppel"]',
 1,
 'The principle of indemnity ensures that insurance compensates the insured for the actual loss suffered, restoring them to their pre-loss financial position — no more, no less.',
 'both'),

-- Law and the Insurance Contract (2 questions)
('00000000-0000-0000-0000-000000000001',
 'Chapter 3: Law and the Insurance Contract',
 'An insurance contract is considered a contract of adhesion because:',
 '["Both parties negotiate the terms equally", "The insured writes the terms of the policy", "The insurer drafts the contract and the insured must accept or reject it as written", "It requires mutual agreement on every clause"]',
 2,
 'A contract of adhesion is one where one party (the insurer) drafts the terms and the other party (the insured) can only accept or reject it. Any ambiguities are construed in favor of the insured.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 3: Law and the Insurance Contract',
 'Which element is NOT required for a valid insurance contract?',
 '["Offer and acceptance", "Consideration", "A written signature by a notary", "Competent parties"]',
 2,
 'The four essential elements of a valid contract are: offer and acceptance, consideration, competent parties, and legal purpose. Notarization is not a requirement for insurance contracts.',
 'both'),

-- Licensure, Ethics, and the Insurance Producer (2 questions)
('00000000-0000-0000-0000-000000000001',
 'Chapter 4: Licensure, Ethics, and the Insurance Producer',
 'In Florida, what must a person do before soliciting, negotiating, or selling insurance?',
 '["Complete a college degree in business", "Obtain a valid insurance license from the state", "Work for an insurance company for at least one year", "Pass a federal licensing examination"]',
 1,
 'Florida law requires that any person who solicits, negotiates, or sells insurance must first obtain the appropriate license from the Florida Department of Financial Services.',
 'both'),

('00000000-0000-0000-0000-000000000001',
 'Chapter 4: Licensure, Ethics, and the Insurance Producer',
 'Which of the following actions would be considered an unfair trade practice in insurance?',
 '["Providing accurate premium quotes to prospective clients", "Misrepresenting the terms or benefits of an insurance policy", "Recommending appropriate coverage levels based on client needs", "Explaining policy exclusions to applicants"]',
 1,
 'Misrepresenting the terms, benefits, or conditions of an insurance policy is a prohibited unfair trade practice under Florida insurance law. Agents must provide truthful, accurate information.',
 'both');
