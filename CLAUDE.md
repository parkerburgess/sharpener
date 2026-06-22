# Good/Bad Calendar

## Project Overview
this is for training up my skills and knowledge with testing.  Tests will have topics, will be multiple choice at first but will grow to short answer.
questions and results will be held in a database and be reviewable.  Results and exam history will be held historically.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Storage**: mssql to a sql server

## Architecture

### Data Access Layer (DAL)
-- the data structure already exists in an empty database.  the definition is in database-schema.md that is imported below
-- the creds are in env.var
-- follow the data access pattern used in C:/Code/good-bad-calendar
@database-schema.md

### data population
- for now I'll provice a JSON file with the relevant informantion, I want you to create that template

### auth
- follow the same pattern used in C:/Code/good-bad-calendar

### exams
- there will be no time limit
- when an exam is create all the result rows are filled in.
- answering a question will update either the AnswerOptionId or TextResponse depending on if the questions is multi choice or short answer
- a question may be skipped, this will be counted as a missed question

## UI Specification

### main page
- there will be 3 controls: ExamSetUp, ExamResults, SkillsRatings
- there will be a temporary button or control to import a JSON file to create questions

#### ExamSetUp
- options for a title(string), Level(checkboxes), Topic(checkboxes), QuestionType(checkboxes)
- the Level, Topic, QuestionType values will come from the database look-up tables 
- a Start Exam button

#### ExamResults
- one card for each exam, order by date desc
- provide a dropdown filter to restrict the date range (prior days): 7, 30, 90, all; defaults to all
- provide a dropdown filter to restrict the topic; defaults to all
- the exam cards will prominently display a % then the topic, correct/questions, date taken 
- the card will have a review option to see the questions

#### SkillsRating
- one card for each of the topics tested
- a rating will be the average of the results for all exams from that topic
-      more advanced rating algorithyms later
-      this is a low priority task but will still probably happen

### Exam Questions
- a question will be displayed in full at the top
- next will be either a list of multiple choice options, radio so only one can be selected, or a text box
- there will be a button to skip the question, the user cannot go back to skipped questions
- for multi choice on selection it will be flagged as correct or not, it cannot be changed
- a short text answer will need a submit button, ti cannot be changed
- on answer selection or submition:
    - the Result table will be updated 
    - the Question.Explination will be displayed
    - the skip button will be disabled
    - a next button will appear to advance to the next question
        - this will be a results button after the last question

### results page
- same data and controls as the ExamResults card with a close button to go home

### Review
- same display as the exam questions but with the given answers, Explination visible, and all but next button disabled
- there should be a banner on top stating that it is review
- there should be a toggle to only show missed questions.




## Styling Rules
- Input placeholder text must always have an explicit color set — never rely on browser defaults, which render at ~40% opacity and are often unreadable. Use Tailwind's `placeholder-gray-500` (light bg) or `placeholder-gray-400` (dark bg) at minimum.
- Labels, checkbox item text, and `<select>` elements must always have an explicit text color (e.g. `text-gray-800`). The CSS foreground variable goes light in dark mode, making inherited text invisible against white/light component backgrounds.

## Development Rules
- Next.js API routes handle all data operations (components never touch the DAL directly)
- Async/await everywhere; never `.Result` or `.Wait()`
- Strongly typed — no `any`, `object`, or `dynamic`
- No hardcoded file paths — use a single config constant
