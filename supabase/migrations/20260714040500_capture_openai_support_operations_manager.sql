-- Capture the complete official OpenAI Support Operations Manager posting and
-- replace the candidate-card-only brief with source-grounded structured data.
-- This is intentionally additive and preserves existing role decisions,
-- workflow history, and generated document versions.

with actor as (
  select id as user_id
  from auth.users
  where lower(email) = 'matt@bamboo.holdings'
  limit 1
), source_payload as (
  select
    'resurfaced-5988b6dbf357b866fbe96e5e'::text as job_id,
    'https://jobs.ashbyhq.com/openai/c7f26e3d-7345-44a6-8e5a-3599679bfe9e'::text as source_url,
    'df07w5'::text as posting_hash,
    'mqartx'::text as normalized_posting_hash,
    $posting$Support Operations Manager
Location

San Francisco

Employment Type

Full time

Location Type

Hybrid

Department

User Operations

Compensation
$279K - $310K - Offers Equity

The base pay offered may vary depending on multiple individualized factors, including market location, job-related knowledge, skills, and experience. If the role is non-exempt, overtime pay will be provided consistent with applicable laws. In addition to the salary range listed above, total compensation also includes generous equity, performance-related bonus(es) for eligible employees, and the following benefits.

Medical, dental, and vision insurance for you and your family, with employer contributions to Health Savings Accounts

Pre-tax accounts for Health FSA, Dependent Care FSA, and commuter expenses (parking and transit)

401(k) retirement plan with employer match

Paid parental leave (up to 24 weeks for birth parents and 20 weeks for non-birthing parents), plus paid medical and caregiver leave (up to 8 weeks)

Paid time off: flexible PTO for exempt employees and up to 15 days annually for non-exempt employees

13+ paid company holidays, and multiple paid coordinated company office closures throughout the year for focus and recharge, plus paid sick or safe time (1 hour per 30 hours worked, or more, as required by applicable state or local law)

Mental health and wellness support

Employer-paid basic life and disability coverage

Annual learning and development stipend to fuel your professional growth

Daily meals in our offices, and meal delivery credits as eligible

Relocation support for eligible employees

Additional taxable fringe benefits, such as charitable donation matching and wellness stipends, may also be provided.

More details about our benefits are available to candidates during the hiring process.

This role is at-will and OpenAI reserves the right to modify base pay and other compensation components at any time based on individual performance, team or company results, or market conditions.

About the Team

The Support team is central to ensuring that our customers' experience with our products is nothing short of exceptional. We resolve complex issues, provide technical guidance, and support customers in maximizing value and adoption from deploying our products. We work closely with Sales, Technical Success, Product, Engineering and others to deliver the best possible experience to our customers at scale. OpenAI's customers represent a range of diverse backgrounds and maturity, from individual customers to early-stage startups and established global enterprises. Given OpenAI's breakneck shipping cadence and growth - and the expectation that it will only accelerate - our ability to architect automation systems and agentic workflows for scale is central to our ability to maintain exceptional support quality in the face of AGI.

About the Role

We are seeking a Support Operations Manager who combines operational leadership, systems thinking, vendor management, and hands-on execution. You'll own service health, automation programs, partner and vendor management. In addition to delivering high-quality service, you'll identify opportunities to reduce manual work, experiment with tools and help operationalize AI across support at scale.

This is not a traditional support operations manager role. We're looking for someone to help us define the future of support, who thrive at the intersection of team/project management, systems building, data science/engineering, and with deep craft experience in the support operations space.

This role is based in San Francisco, CA. We use a hybrid work model of 3 days in the office per week and offer relocation assistance to new employees.

In this role, you will:

Lead and evolve organizational design for our frontline operations across partner and vendor management, coaching teams to expand automation and deliver measurable capacity gains.

Lead multi-site partner management, including commercial ownership, capacity planning and workforce management, QBRs, and performance recovery.

Own end-to-end service governance for partner and vendor teams, including automation rate, cost to serve, first-response time, productivity, and quality.

Set standards for how work gets done at scale, replacing one-off fixes with reusable systems.

Upskill teams and partner with Automation Engineering, Support Engineering, and Fraud & Risk to embed LLM-powered tools into frontline workflows.

You might thrive in this role if you:

Have 8+ years of experience leading support operations teams and a strong track record of coaching, driving accountability, and improving performance and automation adoption at scale

Are comfortable managing a team while staying hands-on in solving ambiguous operational problems.

Are fluent in operational data and technical collaboration, able to define metrics, interpret dashboards, design experiments, and partner with engineering and data teams to turn ambiguous support problems into scalable systems.

Think in systems, using process design, data, tooling, and automation to reduce manual work and create durable capacity.

Can partner credibly with technical teams and translate support needs into clear requirements, owning problem definition, adoption, change management, and operational outcomes

Are energized by building structure in a high-growth environment where the support model, tooling, and partner strategy are still evolving.

Have scaled support operations through organizational design and tooling in a high-growth technology company without compromising quality.

About OpenAI

OpenAI is an AI research and deployment company dedicated to ensuring that general-purpose artificial intelligence benefits all of humanity. We push the boundaries of the capabilities of AI systems and seek to safely deploy them to the world through our products. AI is an extremely powerful tool that must be created with safety and human needs at its core, and to achieve our mission, we must encompass and value the many different perspectives, voices, and experiences that form the full spectrum of humanity.

OpenAI is an equal opportunity employer. Background checks will be administered in accordance with applicable law. Reasonable accommodations are available to applicants with disabilities. OpenAI's Global Applicant Privacy Policy applies.$posting$::text as raw_text,
    $brief${
      "company_about_short": "OpenAI is an AI research and deployment company focused on ensuring that general-purpose artificial intelligence benefits all of humanity.",
      "company_business_model": "Researches, develops, and deploys general-purpose AI systems and products for individual and enterprise customers.",
      "company_stage_or_context": "Frontier AI company operating at rapid product-shipping cadence and growth, serving customers from individuals and startups to global enterprises.",
      "role_about_short": "Lead the operating system behind OpenAI Support: frontline organizational design, partner and vendor performance, service health, automation, and scalable AI-enabled workflows.",
      "role_mandate": "Build durable support operations that preserve quality while increasing automation, capacity, and operational control across internal and outsourced frontline teams.",
      "why_they_are_hiring": "OpenAI's accelerating product cadence and customer growth require a more scalable support model, stronger partner governance, and agentic automation that can reduce manual work without compromising service quality.",
      "main_responsibilities": [
        "Evolve frontline organizational design across partner and vendor operations while coaching teams to expand automation and capacity.",
        "Own multi-site partner management, commercial governance, capacity planning, workforce management, QBRs, and performance recovery.",
        "Own service governance metrics including automation rate, cost to serve, first-response time, productivity, and quality.",
        "Replace one-off fixes with reusable operating standards and scalable systems.",
        "Partner with Automation Engineering, Support Engineering, and Fraud & Risk to embed LLM-powered tools in frontline workflows."
      ],
      "required_qualifications": [
        "8+ years leading support operations teams with evidence of coaching, accountability, performance improvement, and automation adoption at scale.",
        "Experience managing a team while remaining hands-on in ambiguous operational problem solving.",
        "Fluency in operational data and technical collaboration, including metric definition, dashboard interpretation, experiment design, and partnership with engineering and data teams.",
        "Systems-thinking experience using process design, data, tooling, and automation to create durable capacity.",
        "Ability to translate support needs into technical requirements and own adoption, change management, and operational outcomes.",
        "Experience building structure in a high-growth environment where tooling and partner strategy are evolving.",
        "Experience scaling support operations through organizational design and tooling without compromising quality."
      ],
      "preferred_qualifications": [],
      "key_skills_and_keywords": [
        "support operations", "organizational design", "vendor management", "partner management", "commercial ownership", "capacity planning", "workforce management", "QBRs", "service governance", "automation", "cost to serve", "first-response time", "productivity", "quality", "LLM-powered workflows", "operational data", "experiment design", "systems thinking", "change management"
      ],
      "team_context": "The Support team serves individual, startup, and global-enterprise customers and works closely with Sales, Technical Success, Product, Engineering, Automation Engineering, Support Engineering, and Fraud & Risk.",
      "reporting_relationship": "Needs verification",
      "stakeholders": ["Support leadership", "Frontline operations teams", "Partner and vendor leaders", "Sales", "Technical Success", "Product", "Engineering", "Automation Engineering", "Support Engineering", "Fraud & Risk"],
      "success_metrics": ["Automation rate", "Cost to serve", "First-response time", "Productivity", "Quality", "Measurable capacity gains", "Partner performance recovery", "Automation adoption"],
      "location_requirements": "San Francisco, California; hybrid with three days per week in the office. Relocation assistance is offered to new employees.",
      "remote_eligibility": "No remote option is stated in the official posting.",
      "travel_requirements": "Needs verification",
      "compensation_summary": "$279,000-$310,000 base salary plus equity, performance-related bonus eligibility, and benefits.",
      "equity_bonus_notes": "The posting states that total compensation includes generous equity and performance-related bonuses for eligible employees.",
      "why_it_may_fit_matthew": "Matthew's experience with scaled service operations, BPO/vendor capacity, operating governance, and automation maps directly to the role's core mandate. His founder-operator systems orientation is relevant to replacing manual work with durable workflows in a fast-changing environment.",
      "concerns_or_gaps": "The role requires relocation to San Francisco and unusually deep direct support-operations, operational-data, and technical-collaboration evidence that should be proven precisely rather than implied.",
      "verification_needed": [
        "Confirm reporting line, internal level, and team size.",
        "Confirm the expected scope of commercial ownership and vendor spend.",
        "Verify how much direct support-operations leadership versus adjacent service operations experience is required.",
        "Confirm bonus target, equity range, and expected total compensation.",
        "Confirm relocation timing, assistance, and any flexibility in the three-day office requirement.",
        "Confirm travel expectations."
      ]
    }$brief$::jsonb as parsed_brief,
    array[
      'Evolve frontline organizational design across partner and vendor operations while coaching teams to expand automation and capacity.',
      'Own multi-site partner management, commercial governance, capacity planning, workforce management, QBRs, and performance recovery.',
      'Own service governance metrics including automation rate, cost to serve, first-response time, productivity, and quality.',
      'Replace one-off fixes with reusable operating standards and scalable systems.',
      'Partner with Automation Engineering, Support Engineering, and Fraud & Risk to embed LLM-powered tools in frontline workflows.'
    ]::text[] as responsibilities,
    array[
      '8+ years leading support operations teams with evidence of coaching, accountability, performance improvement, and automation adoption at scale.',
      'Experience managing a team while remaining hands-on in ambiguous operational problem solving.',
      'Fluency in operational data and technical collaboration, including metric definition, dashboard interpretation, experiment design, and partnership with engineering and data teams.',
      'Systems-thinking experience using process design, data, tooling, and automation to create durable capacity.',
      'Ability to translate support needs into technical requirements and own adoption, change management, and operational outcomes.',
      'Experience building structure in a high-growth environment where tooling and partner strategy are evolving.',
      'Experience scaling support operations through organizational design and tooling without compromising quality.'
    ]::text[] as required_qualifications,
    array[]::text[] as preferred_qualifications,
    array[
      'support operations', 'organizational design', 'vendor management', 'partner management', 'commercial ownership', 'capacity planning', 'workforce management', 'QBRs', 'service governance', 'automation', 'cost to serve', 'first-response time', 'productivity', 'quality', 'LLM-powered workflows', 'operational data', 'experiment design', 'systems thinking', 'change management'
    ]::text[] as skills_keywords
), updated_job as (
  update public.jobcc_jobs j
  set
    location = 'San Francisco, California',
    posting_hash = p.posting_hash,
    normalized_posting_hash = p.normalized_posting_hash,
    prior_posting_hash = case
      when coalesce(j.posting_hash, '') <> '' and j.posting_hash <> p.posting_hash then j.posting_hash
      else j.prior_posting_hash
    end,
    posting_changed_yes_no = coalesce(j.posting_hash, '') <> '' and j.posting_hash <> p.posting_hash,
    first_captured_at = coalesce(j.first_captured_at, now()),
    last_captured_at = now(),
    last_verified_at = now(),
    parsing_model_version = '2026-07-14-official-source-manual-parse-v1',
    analysis_status = 'source_verified_parsed_ready_for_scoring',
    score_status = 'needs_recalculation_from_full_posting',
    analysis_reused = false,
    rerun_reason = 'full_official_posting_captured',
    packet_eligibility = 'eligible_when_packet_requested',
    packet_blocked_reason = 'Packet generation remains off until Matthew explicitly requests it for this role.',
    record = coalesce(j.record, '{}'::jsonb) || jsonb_build_object(
      'company', 'OpenAI',
      'role_title', 'Support Operations Manager',
      'location', 'San Francisco, California',
      'department', 'User Operations',
      'employment_type', 'Full time',
      'work_style', 'Hybrid - three days per week in office',
      'location_category', 'relocation required',
      'region_preference_score', -35,
      'relocation_required', true,
      'relocation_friction_score', 82,
      'relocation_threshold_adjustment', 27,
      'compensation_adjusted_for_location', 'High listed base plus equity and bonus, but the San Francisco move, taxes, housing, and family disruption raise the opportunity threshold.',
      'family_lifestyle_considerations', 'A move from Scottsdale to San Francisco would require family, school, community, housing, and cost-of-living review.',
      'city_region_notes', 'San Francisco hybrid role with three required office days and relocation assistance.',
      'location_concerns', jsonb_build_array('Relocation appears required', 'Three in-office days per week', 'Higher cost of living and tax burden'),
      'relocation_verdict', 'high-friction, only advance if exceptional',
      'listed_base_min', 279000,
      'listed_base_max', 310000,
      'compensation_listed_yes_no', true,
      'compensation_status', 'listed',
      'compensation_verdict', 'clearly_above_threshold',
      'listed_total_comp_notes', 'Base salary plus generous equity and performance-related bonus eligibility.',
      'estimated_comp_band', '$279K-$310K base plus bonus and equity',
      'estimated_comp_confidence', 'high',
      'compensation_source', 'official OpenAI Ashby posting',
      'compensation_questions_to_verify', jsonb_build_array('What is the performance bonus target?', 'What equity range is assigned to this level?', 'What internal level is this role mapped to?'),
      'official_source_url', p.source_url,
      'ats_source_url', p.source_url,
      'posting_source_url', p.source_url,
      'source_url', p.source_url,
      'posting_source_name', 'OpenAI careers / Ashby ATS',
      'source_name', 'OpenAI careers',
      'source_type', 'ATS'
    ) || jsonb_build_object(
      'source_status', 'official_verified',
      'active_status', 'verified_active',
      'link_health', 'ok',
      'company_job_id', 'c7f26e3d-7345-44a6-8e5a-3599679bfe9e',
      'source_verified_by', 'official_url_capture',
      'source_verification_notes', 'Official OpenAI Ashby URL opened in the authenticated browser workflow; complete visible posting text was captured and parsed on 2026-07-14.',
      'grounding_metadata_status', 'unavailable_provider_response',
      'grounding_source_urls', jsonb_build_array(p.source_url),
      'grounding_queries', '[]'::jsonb,
      'grounding_chunks_count', 0,
      'url_context_used', false,
      'google_search_used', false,
      'candidate_card_captured', true,
      'full_posting_captured', true,
      'source_verification_status', 'full_posting_captured',
      'raw_posting_text', p.raw_text,
      'job_description_text', p.raw_text,
      'job_description_text_full', p.raw_text,
      'full_posting_character_count', length(p.raw_text),
      'posting_hash', p.posting_hash,
      'normalized_posting_hash', p.normalized_posting_hash,
      'posting_capture_date', now(),
      'last_verified_at', now(),
      'parsed_job_brief', p.parsed_brief,
      'parsed_brief_complete', true,
      'responsibilities', to_jsonb(p.responsibilities),
      'required_qualifications', to_jsonb(p.required_qualifications),
      'preferred_qualifications', to_jsonb(p.preferred_qualifications),
      'skills_keywords', to_jsonb(p.skills_keywords),
      'team_summary', p.parsed_brief ->> 'team_context',
      'analysis_status', 'source_verified_parsed_ready_for_scoring',
      'score_status', 'needs_recalculation_from_full_posting',
      'packet_eligibility', 'eligible_when_packet_requested',
      'packet_blocked_reason', 'Packet generation remains off until Matthew explicitly requests it for this role.'
    ),
    updated_at = now()
  from source_payload p, actor a
  where j.id = p.job_id and j.user_id = a.user_id
  returning j.id, j.user_id
)
insert into public.jobcc_job_descriptions (
  id,
  user_id,
  job_id,
  description_text,
  job_summary,
  responsibilities,
  required_qualifications,
  preferred_qualifications,
  skills_keywords,
  team_summary,
  source_url,
  parsing_model_version,
  posting_hash,
  normalized_posting_hash,
  posting_changed_yes_no,
  first_captured_at,
  last_captured_at,
  last_verified_at,
  analysis_status,
  score_status,
  analysis_reused,
  rerun_reason,
  packet_eligibility,
  packet_blocked_reason,
  record,
  updated_at
)
select
  p.job_id || '-description',
  u.user_id,
  p.job_id,
  p.raw_text,
  p.parsed_brief ->> 'role_about_short',
  p.responsibilities,
  p.required_qualifications,
  p.preferred_qualifications,
  p.skills_keywords,
  p.parsed_brief ->> 'team_context',
  p.source_url,
  '2026-07-14-official-source-manual-parse-v1',
  p.posting_hash,
  p.normalized_posting_hash,
  false,
  now(),
  now(),
  now(),
  'source_verified_parsed_ready_for_scoring',
  'needs_recalculation_from_full_posting',
  false,
  'full_official_posting_captured',
  'eligible_when_packet_requested',
  'Packet generation remains off until Matthew explicitly requests it for this role.',
  jsonb_build_object(
    'company', 'OpenAI',
    'role_title', 'Support Operations Manager',
    'raw_posting_text', p.raw_text,
    'parsed_job_brief', p.parsed_brief,
    'official_source_url', p.source_url,
    'ats_source_url', p.source_url,
    'posting_source_url', p.source_url,
    'posting_source_name', 'OpenAI careers / Ashby ATS',
    'source_type', 'ATS',
    'source_status', 'official_verified',
    'active_status', 'verified_active',
    'link_health', 'ok',
    'source_verified_by', 'official_url_capture',
    'grounding_metadata_status', 'unavailable_provider_response',
    'grounding_source_urls', jsonb_build_array(p.source_url),
    'grounding_queries', '[]'::jsonb,
    'grounding_chunks_count', 0,
    'url_context_used', false,
    'google_search_used', false,
    'candidate_card_captured', true,
    'full_posting_captured', true,
    'source_verification_status', 'full_posting_captured',
    'full_posting_character_count', length(p.raw_text),
    'posting_hash', p.posting_hash,
    'normalized_posting_hash', p.normalized_posting_hash,
    'captured_at', now(),
    'last_verified_at', now(),
    'parsed_brief_complete', true,
    'analysis_status', 'source_verified_parsed_ready_for_scoring',
    'score_status', 'needs_recalculation_from_full_posting',
    'packet_eligibility', 'eligible_when_packet_requested'
  ),
  now()
from source_payload p
join updated_job u on u.id = p.job_id
on conflict (id) do update set
  description_text = excluded.description_text,
  job_summary = excluded.job_summary,
  responsibilities = excluded.responsibilities,
  required_qualifications = excluded.required_qualifications,
  preferred_qualifications = excluded.preferred_qualifications,
  skills_keywords = excluded.skills_keywords,
  team_summary = excluded.team_summary,
  source_url = excluded.source_url,
  parsing_model_version = excluded.parsing_model_version,
  posting_hash = excluded.posting_hash,
  normalized_posting_hash = excluded.normalized_posting_hash,
  posting_changed_yes_no = excluded.posting_changed_yes_no,
  first_captured_at = coalesce(public.jobcc_job_descriptions.first_captured_at, excluded.first_captured_at),
  last_captured_at = excluded.last_captured_at,
  last_verified_at = excluded.last_verified_at,
  analysis_status = excluded.analysis_status,
  score_status = excluded.score_status,
  analysis_reused = excluded.analysis_reused,
  rerun_reason = excluded.rerun_reason,
  packet_eligibility = excluded.packet_eligibility,
  packet_blocked_reason = excluded.packet_blocked_reason,
  record = coalesce(public.jobcc_job_descriptions.record, '{}'::jsonb) || excluded.record,
  updated_at = excluded.updated_at;
