class APIFeatures {
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString;
    }

    search(){
        const keyword = this.queryString.keyword ? {
            name: {
            $regex : this.queryString.keyword,
            $options: 'i'
            }
        } : {}
        console.log(keyword);
        this.query = this.query.find({...keyword});
        return this;
    }
    filter(){
        const query_copy = {...this.queryString};

        // console.log(query_copy);
        // removing fields from query 

        const removeFields = ['keyword','limt','page']
        removeFields.forEach(el => delete query_copy[el])
        // Advance Filter 
        let querystr = JSON.stringify(query_copy)
        console.log(query_copy);
        querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)
        console.log(querystr);
        this.query = this.query.find(JSON.parse(querystr));
        return this;
        
    }
    pagination(resPerpage){
        const currentPage = Number(this.queryString.page) || 1;
        const skip = resPerpage * (currentPage - 1);

        this.query = this.query.limit(resPerpage).skip(skip);
        return this;
    }
}

module.exports = APIFeatures;