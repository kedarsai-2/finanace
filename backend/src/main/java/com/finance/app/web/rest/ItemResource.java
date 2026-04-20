package com.finance.app.web.rest;

import com.finance.app.repository.ItemRepository;
import com.finance.app.service.ItemQueryService;
import com.finance.app.service.ItemService;
import com.finance.app.service.criteria.ItemCriteria;
import com.finance.app.service.dto.ItemDTO;
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
 * REST controller for managing {@link com.finance.app.domain.Item}.
 */
@RestController
@RequestMapping("/api/items")
public class ItemResource {

    private static final Logger LOG = LoggerFactory.getLogger(ItemResource.class);

    private static final String ENTITY_NAME = "item";

    @Value("${jhipster.clientApp.name:backend}")
    private String applicationName;

    private final ItemService itemService;

    private final ItemRepository itemRepository;

    private final ItemQueryService itemQueryService;

    public ItemResource(ItemService itemService, ItemRepository itemRepository, ItemQueryService itemQueryService) {
        this.itemService = itemService;
        this.itemRepository = itemRepository;
        this.itemQueryService = itemQueryService;
    }

    /**
     * {@code POST  /items} : Create a new item.
     *
     * @param itemDTO the itemDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new itemDTO, or with status {@code 400 (Bad Request)} if the item has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ItemDTO> createItem(@Valid @RequestBody ItemDTO itemDTO) throws URISyntaxException {
        LOG.debug("REST request to save Item : {}", itemDTO);
        if (itemDTO.getId() != null) {
            throw new BadRequestAlertException("A new item cannot already have an ID", ENTITY_NAME, "idexists");
        }
        itemDTO = itemService.save(itemDTO);
        return ResponseEntity.created(new URI("/api/items/" + itemDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, itemDTO.getId().toString()))
            .body(itemDTO);
    }

    /**
     * {@code PUT  /items/:id} : Updates an existing item.
     *
     * @param id the id of the itemDTO to save.
     * @param itemDTO the itemDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated itemDTO,
     * or with status {@code 400 (Bad Request)} if the itemDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the itemDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ItemDTO> updateItem(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody ItemDTO itemDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Item : {}, {}", id, itemDTO);
        if (itemDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, itemDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!itemRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        itemDTO = itemService.update(itemDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, itemDTO.getId().toString()))
            .body(itemDTO);
    }

    /**
     * {@code PATCH  /items/:id} : Partial updates given fields of an existing item, field will ignore if it is null
     *
     * @param id the id of the itemDTO to save.
     * @param itemDTO the itemDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated itemDTO,
     * or with status {@code 400 (Bad Request)} if the itemDTO is not valid,
     * or with status {@code 404 (Not Found)} if the itemDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the itemDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ItemDTO> partialUpdateItem(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody ItemDTO itemDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Item partially : {}, {}", id, itemDTO);
        if (itemDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, itemDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!itemRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ItemDTO> result = itemService.partialUpdate(itemDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, itemDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /items} : get all the Items.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of Items in body.
     */
    @GetMapping("")
    public ResponseEntity<List<ItemDTO>> getAllItems(
        ItemCriteria criteria,
        @org.springdoc.core.annotations.ParameterObject Pageable pageable
    ) {
        LOG.debug("REST request to get Items by criteria: {}", criteria);

        Page<ItemDTO> page = itemQueryService.findByCriteria(criteria, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /items/count} : count all the items.
     *
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the count in body.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countItems(ItemCriteria criteria) {
        LOG.debug("REST request to count Items by criteria: {}", criteria);
        return ResponseEntity.ok().body(itemQueryService.countByCriteria(criteria));
    }

    /**
     * {@code GET  /items/:id} : get the "id" item.
     *
     * @param id the id of the itemDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the itemDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ItemDTO> getItem(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Item : {}", id);
        Optional<ItemDTO> itemDTO = itemService.findOne(id);
        return ResponseUtil.wrapOrNotFound(itemDTO);
    }

    /**
     * {@code DELETE  /items/:id} : delete the "id" item.
     *
     * @param id the id of the itemDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Item : {}", id);
        itemService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
