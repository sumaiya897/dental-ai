# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: anxious new patients (dental-anxious adults and parents booking for children) deciding whether to trust a local dental practice. Their job is to book a first visit. Secondary audience (unconfirmed): the dental practices who would adopt this as a template.

## Product Purpose

An animated marketing and booking website for a dental practice, built as a reusable template that can be re-skinned for many dentists. Success is a new patient completing the "Book a visit" request (name, phone, reason, preferred date) or calling the front desk.

## Positioning

Modern digital dentistry: 3D scans, mould-free digital aligner scans, and visual before/after planning, delivered to make a nervous patient feel informed rather than surprised.

## Operating Context

Single-page static site (index.html, styles.css, main.js) with a hero video, before/after whitening slider, treatments, approach, team, reviews, FAQ and a booking form. Booking confirms by text message within the hour.

## Capabilities and Constraints

- Plain static HTML/CSS/JS, no framework or build step; served locally with `npx http-server`.
- Because it is a template, practice-specific content (name, address, hours, phone, team, stats, reviews, prices) must stay easy to swap and is not fabricated fact.
- Current sample practice is "Lumen Dental" with placeholder doctors, reviews and statistics. Treat all of it as sample content, never as real claims.
- Before/after imagery is an illustrative simulation on stock photography; results disclaimer must stay.

## Evidence on Hand

Sample copy and stock imagery only (`assets/hero.mp4`, `assets/poster.jpg`, `assets/sparkle.jpg`, `assets/photos/`). No real testimonials, case studies, credentials or press exist. Do not fabricate any.

## Product Principles

1. Reduce dread: every section should lower anxiety, not raise pressure.
2. Show the technology as reassurance (scans, plans, written prices), not as spectacle.
3. Booking is always one step away and asks for the minimum.
4. Template-first: content is swappable, claims are honest, nothing implies a real practice's credentials.

## Accessibility & Inclusion

No product-specific standard established. Animated content should respect reduced-motion preferences, and the intro must never block access to content.
