package com.finance.app.web.rest;

import com.finance.app.repository.ExpenseCategoryRepository;
import com.finance.app.service.ExpenseCategoryService;
import com.finance.app.service.dto.ExpenseCategoryDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.finance.app.domain.ExpenseCategory}.
 */
@RestController
@RequestMapping("/api/expense-categories")
public class ExpenseCategoryResource {

    private static final Logger LOG = LoggerFactory.getLogger(ExpenseCategoryResource.class);

    private static final String ENTITY_NAME = "expenseCategory";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final ExpenseCategoryService expenseCategoryService;

    private final ExpenseCategoryRepository expenseCategoryRepository;

    public ExpenseCategoryResource(ExpenseCategoryService expenseCategoryService, ExpenseCategoryRepository expenseCategoryRepository) {
        this.expenseCategoryService = expenseCategoryService;
        this.expenseCategoryRepository = expenseCategoryRepository;
    }

    /**
     * {@code POST  /expense-categories} : Create a new expenseCategory.
     *
     * @param expenseCategoryDTO the expenseCategoryDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new expenseCategoryDTO, or with status {@code 400 (Bad Request)} if the expenseCategory has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ExpenseCategoryDTO> createExpenseCategory(@Valid @RequestBody ExpenseCategoryDTO expenseCategoryDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save ExpenseCategory : {}", expenseCategoryDTO);
        if (expenseCategoryDTO.getId() != null) {
            throw new BadRequestAlertException("A new expenseCategory cannot already have an ID", ENTITY_NAME, "idexists");
        }
        expenseCategoryDTO = expenseCategoryService.save(expenseCategoryDTO);
        return ResponseEntity.created(new URI("/api/expense-categories/" + expenseCategoryDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, expenseCategoryDTO.getId().toString()))
            .body(expenseCategoryDTO);
    }

    /**
     * {@code PUT  /expense-categories/:id} : Updates an existing expenseCategory.
     *
     * @param id the id of the expenseCategoryDTO to save.
     * @param expenseCategoryDTO the expenseCategoryDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated expenseCategoryDTO,
     * or with status {@code 400 (Bad Request)} if the expenseCategoryDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the expenseCategoryDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ExpenseCategoryDTO> updateExpenseCategory(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody ExpenseCategoryDTO expenseCategoryDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update ExpenseCategory : {}, {}", id, expenseCategoryDTO);
        if (expenseCategoryDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, expenseCategoryDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!expenseCategoryRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        expenseCategoryDTO = expenseCategoryService.update(expenseCategoryDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, expenseCategoryDTO.getId().toString()))
            .body(expenseCategoryDTO);
    }

    /**
     * {@code PATCH  /expense-categories/:id} : Partial updates given fields of an existing expenseCategory, field will ignore if it is null
     *
     * @param id the id of the expenseCategoryDTO to save.
     * @param expenseCategoryDTO the expenseCategoryDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated expenseCategoryDTO,
     * or with status {@code 400 (Bad Request)} if the expenseCategoryDTO is not valid,
     * or with status {@code 404 (Not Found)} if the expenseCategoryDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the expenseCategoryDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ExpenseCategoryDTO> partialUpdateExpenseCategory(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody ExpenseCategoryDTO expenseCategoryDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update ExpenseCategory partially : {}, {}", id, expenseCategoryDTO);
        if (expenseCategoryDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, expenseCategoryDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!expenseCategoryRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ExpenseCategoryDTO> result = expenseCategoryService.partialUpdate(expenseCategoryDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, expenseCategoryDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /expense-categories} : get all the Expense Categories.
     *
     * @param pageable the pagination information.
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Expense Categories in body.
     */
    @GetMapping("")
    public ResponseEntity<List<ExpenseCategoryDTO>> getAllExpenseCategories(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of ExpenseCategories");
        Page<ExpenseCategoryDTO> page;
        if (eagerload) {
            page = expenseCategoryService.findAllWithEagerRelationships(pageable);
        } else {
            page = expenseCategoryService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /expense-categories/:id} : get the "id" expenseCategory.
     *
     * @param id the id of the expenseCategoryDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the expenseCategoryDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseCategoryDTO> getExpenseCategory(@PathVariable("id") Long id) {
        LOG.debug("REST request to get ExpenseCategory : {}", id);
        Optional<ExpenseCategoryDTO> expenseCategoryDTO = expenseCategoryService.findOne(id);
        return ResponseUtil.wrapOrNotFound(expenseCategoryDTO);
    }

    /**
     * {@code DELETE  /expense-categories/:id} : delete the "id" expenseCategory.
     *
     * @param id the id of the expenseCategoryDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpenseCategory(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete ExpenseCategory : {}", id);
        expenseCategoryService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
