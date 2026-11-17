# LifeKey – Your Medical Information, Always Within Reach

LifeKey is a web-based medical information management application. It helps users keep essential medical details and medical documents together, create a printable medical identity card, and access a digital record through a QR code.

**Live website:** https://life-key.netlify.app/

> **Project note:** LifeKey is an educational/student project and should be treated as a prototype. It is not a substitute for professional medical records, medical advice, or emergency services. Do not rely on it as the only source of critical medical information.

## Problem Statement

Important medical information can be difficult to access during an emergency. A person may be unable to communicate details such as their blood group, allergies, medical conditions, medications, or emergency contact. Medical reports may also be stored in different places and may not be readily available.

LifeKey aims to make this information easier to organise and access from one place.

## Proposed Solution

LifeKey combines a digital medical profile, a printable wallet-sized medical card, a report vault, and QR-code access to a user's medical record.

## Main Features

- **Account access:** Sign up and log in to use the application.
- **Medical profile:** Store personal details and key medical information, including date of birth, blood group, allergies, medical conditions, current medications, emergency contact, and additional notes.
- **Printable medical card:** Preview a compact medical card containing essential information and a QR code. The card is designed to be printed on A4 landscape paper and folded/cut to wallet size as indicated in the application.
- **Digital report vault:** Upload medical reports, prescriptions, and scans in PDF, JPG, or PNG format. The website indicates a maximum upload size of 10 MB per file.
- **Report organisation:** View uploaded reports and sort them using the available controls.
- **QR access:** Scan the QR code on the medical card to open the associated medical record without requiring the person scanning it to log in.

## Technology

The deployed application presents itself as a browser-based web application. The project implementation has been described as using:

- **HTML** – page structure.
- **CSS** – layout and visual styling.
- **JavaScript** – client-side behaviour and interactions.
- **Supabase** – backend services such as authentication, database, and file storage (where configured in the project).
- **Netlify** – website hosting and deployment.

The exact library versions, build process, Supabase table/storage configuration, and environment-variable names should be confirmed from the source code before modifying or redeploying the project.

## Getting Started

### Use the live application

Open: https://life-key.netlify.app/

Create an account or log in, complete the medical profile, generate the medical card, and upload sample reports to explore the application.

### Run the project locally

1. Obtain the project source code.
2. Open the project folder in Visual Studio Code or another code editor.
3. Check the source files and project instructions for any required Supabase configuration.
4. If the project is a plain HTML/CSS/JavaScript site, open `index.html` using a local development server (for example, the VS Code Live Server extension).
5. If the source includes a `package.json`, follow the scripts and dependency instructions in that file instead.
6. Verify that the configured backend URL and public client key match the intended Supabase project. Never place a Supabase service-role key or other secret in browser-side code.

> This README is based on the deployed website's visible functionality and the technology stack described for the project. The deployed website alone does not expose the complete source code or backend configuration, so local setup details may need adjustment to match the actual source repository.

## Typical User Workflow

1. Open LifeKey and create an account.
2. Sign in and complete the medical profile.
3. Save the profile.
4. Open the Medical Card section and preview or print the card.
5. Open Reports and upload medical documents.
6. Scan the card's QR code with a phone to open the linked record.

## Privacy and Safety

Medical information is sensitive. Use fictional data for classroom demonstrations. Before using the application with real personal information, review the backend access policies, authentication rules, storage permissions, QR-link behaviour, and data-sharing implications.

Anyone who can access a publicly shareable QR record may be able to view the information exposed on that page. Only include information that the user is comfortable sharing, and secure the backend appropriately.

LifeKey is a student project prototype. Information displayed in the application may not be complete, verified, or suitable for clinical decision-making.

## Project Team

Developed as a student project by a three-member team, with AI-assisted development support.

Add the team members' names and actual responsibilities here:

- **Member 1:** [Name] – [Contribution]
- **Member 2:** [Name] – [Contribution]
- **Member 3:** [Name] – [Contribution]

## Future Improvements

Possible future enhancements include stronger privacy controls for shared records, more granular access permissions, improved audit/history features, accessibility improvements, and additional document-management options.

## License

No license is specified. Add a license file if the project is intended to be reused or distributed publicly.
